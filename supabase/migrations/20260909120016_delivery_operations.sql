-- =============================================================================
-- BodGo · operaciones del último tramo.
--
-- El pedido y el viaje son dos cosas distintas que tienen que moverse juntas:
-- cuando el repartidor confirma el retiro, el pedido pasa a 'picked_up'; cuando
-- entrega, el pedido queda 'delivered'. Para que no se puedan desincronizar,
-- ambos caminos escriben el estado del pedido por la misma función interna.
-- =============================================================================

-- La cotización del despacho se congela en el pedido al crearlo: la distancia
-- se calcula en la aplicación (packages/core/src/geo.ts) y acá sólo se guarda.
alter table public.orders add column if not exists distance_km numeric(5,1) check (distance_km >= 0);
alter table public.orders add column if not exists eta_minutes integer check (eta_minutes >= 0);

/** Comisión que BodGo retiene de cada viaje. Espeja core/delivery.ts. */
create or replace function public.courier_commission_rate() returns numeric
  language sql immutable parallel safe as $$ select 0.18::numeric $$;

-- -----------------------------------------------------------------------------
-- Aplicación del estado de un pedido, sin controles de permiso.
--
-- Es el corazón compartido de `advance_order` (lo llama la PyME o el bodeguero)
-- y de `advance_delivery` (lo llama el repartidor). Cada una de esas hace su
-- propia verificación antes de llegar acá.
-- -----------------------------------------------------------------------------
create or replace function public.apply_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_photo_url text,
  p_note text,
  p_actor uuid
) returns public.orders
  language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_item record;
  v_stock integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;

  -- El stock sale de la bodega cuando el bodeguero arma el pedido, no al
  -- entregarlo: desde el picking la mercadería ya no está disponible.
  if p_status = 'picking' then
    for v_item in select product_id, quantity, name from public.order_items where order_id = p_order_id loop
      select quantity into v_stock from public.inventory
      where product_id = v_item.product_id and warehouse_id = v_order.warehouse_id for update;

      if coalesce(v_stock, 0) < v_item.quantity then
        raise exception 'Stock insuficiente de % en la bodega de origen', v_item.name using errcode = '23514';
      end if;

      update public.inventory
      set quantity = quantity - v_item.quantity, updated_at = now()
      where product_id = v_item.product_id and warehouse_id = v_order.warehouse_id;

      insert into public.stock_movements (
        product_id, warehouse_id, type, quantity, reference_type, reference_id, note, created_by
      ) values (
        v_item.product_id, v_order.warehouse_id, 'outbound', -v_item.quantity,
        'order', p_order_id, 'Picking ' || v_order.code, p_actor
      );
    end loop;
  end if;

  update public.orders set
    status = p_status,
    packing_photo_url  = case when p_status = 'ready' then coalesce(p_photo_url, packing_photo_url) else packing_photo_url end,
    delivery_photo_url = case when p_status = 'delivered' then coalesce(p_photo_url, delivery_photo_url) else delivery_photo_url end,
    delivered_at = case when p_status = 'delivered' then now() else delivered_at end
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, status, note, photo_url, actor_id)
  values (p_order_id, p_status, p_note, p_photo_url, p_actor);

  perform public.notify(v_order.pyme_id, 'order_' || p_status,
    'Pedido ' || v_order.code,
    case p_status
      when 'picking'    then 'El bodeguero está preparando el pedido.'
      when 'ready'      then 'El pedido está listo para retiro.'
      when 'picked_up'  then 'El repartidor retiró el pedido de la bodega.'
      when 'in_transit' then 'El pedido va en camino al comprador.'
      when 'delivered'  then 'El comprador recibió su pedido.'
      else 'El pedido cambió de estado.'
    end,
    '/app/pedidos/' || p_order_id);

  return v_order;
end;
$$;

-- -----------------------------------------------------------------------------
-- Ofrecer un viaje a la red de repartidores.
--
-- La tarifa sale de lo que ya se le cobró al comprador al crear el pedido, no
-- se vuelve a calcular: el repartidor cobra eso menos la comisión de BodGo.
-- -----------------------------------------------------------------------------
create or replace function public.request_courier(p_order_id uuid) returns public.deliveries
  language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_zone smallint;
  v_courier_fee integer;
  v_delivery public.deliveries;
begin
  select * into v_order from public.orders where id = p_order_id;

  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;

  if v_order.shipping_cost <= 0 then
    raise exception 'El pedido no tiene tarifa de despacho' using errcode = '23514';
  end if;

  -- Ya hay un viaje vivo para este pedido: no se ofrece de nuevo.
  select * into v_delivery from public.deliveries
  where order_id = p_order_id and status not in ('cancelled', 'expired');

  if found then
    return v_delivery;
  end if;

  -- `shipping_zone` se guarda como 'Zona 3'; si viniera vacío se deduce del
  -- precio, que es lo único que no puede faltar.
  v_zone := coalesce(
    nullif(regexp_replace(coalesce(v_order.shipping_zone, ''), '\D', '', 'g'), '')::smallint,
    case when v_order.shipping_cost <= 2500 then 1
         when v_order.shipping_cost <= 3200 then 2
         when v_order.shipping_cost <= 3900 then 3
         else 4 end
  );
  v_zone := least(4, greatest(1, v_zone));

  v_courier_fee := round(v_order.shipping_cost * (1 - public.courier_commission_rate()) / 100) * 100;

  insert into public.deliveries (
    order_id, warehouse_id, status, zone, distance_km, eta_minutes,
    buyer_fee, commission_amount, courier_fee
  ) values (
    p_order_id, v_order.warehouse_id, 'offered', v_zone, v_order.distance_km, v_order.eta_minutes,
    v_order.shipping_cost, v_order.shipping_cost - v_courier_fee, v_courier_fee
  ) returning * into v_delivery;

  return v_delivery;
end;
$$;

-- -----------------------------------------------------------------------------
-- Avanzar un pedido (PyME o bodeguero).
--
-- Cuando el pedido queda listo y el despacho es con repartidor BodGo, el viaje
-- se ofrece solo: nadie tiene que acordarse de pedirlo.
-- -----------------------------------------------------------------------------
create or replace function public.advance_order(
  p_order_id uuid,
  p_status public.order_status,
  p_photo_url text default null,
  p_note text default null
) returns public.orders
  language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_order public.orders;
  v_allowed public.order_status[];
begin
  select * into v_order from public.orders where id = p_order_id;

  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;

  if v_order.pyme_id <> v_caller
     and not public.owns_warehouse(v_order.warehouse_id)
     and not public.is_admin() then
    raise exception 'No puedes modificar este pedido' using errcode = '42501';
  end if;

  v_allowed := case v_order.status
    when 'pending'   then array['queued', 'cancelled']::public.order_status[]
    when 'queued'    then array['picking', 'cancelled']::public.order_status[]
    when 'picking'   then array['ready', 'cancelled']::public.order_status[]
    when 'ready'     then array['picked_up', 'cancelled']::public.order_status[]
    when 'picked_up' then array['in_transit', 'delivered']::public.order_status[]
    when 'in_transit' then array['delivered']::public.order_status[]
    else array[]::public.order_status[]
  end;

  if not (p_status = any (v_allowed)) then
    raise exception 'No se puede pasar de % a %', v_order.status, p_status using errcode = '23514';
  end if;

  v_order := public.apply_order_status(p_order_id, p_status, p_photo_url, p_note, v_caller);

  if p_status = 'ready' and v_order.delivery_method = 'bodgo_courier' then
    perform public.request_courier(p_order_id);
  end if;

  if p_status = 'cancelled' then
    update public.deliveries
    set status = 'cancelled', cancelled_at = now()
    where order_id = p_order_id and status in ('offered', 'accepted');
  end if;

  return v_order;
end;
$$;

-- -----------------------------------------------------------------------------
-- Ponerse en línea o fuera de línea.
-- -----------------------------------------------------------------------------
create or replace function public.set_courier_online(p_online boolean) returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  update public.courier_profiles
  set is_online = p_online,
      last_online_at = case when p_online then now() else last_online_at end
  where profile_id = auth.uid();

  if not found then
    raise exception 'No tienes una cuenta de repartidor' using errcode = '42501';
  end if;

  return p_online;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tomar un viaje ofrecido.
--
-- El `for update` sobre la fila es lo que evita que dos repartidores acepten el
-- mismo viaje: el segundo espera, encuentra el estado ya cambiado y recibe el
-- aviso de que se lo ganaron.
-- -----------------------------------------------------------------------------
create or replace function public.accept_delivery(p_delivery_id uuid) returns public.deliveries
  language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_delivery public.deliveries;
  v_online boolean;
begin
  select is_online into v_online from public.courier_profiles where profile_id = v_caller;

  if v_online is null then
    raise exception 'No tienes una cuenta de repartidor' using errcode = '42501';
  end if;

  if not v_online then
    raise exception 'Tienes que estar en línea para aceptar un viaje' using errcode = '23514';
  end if;

  if exists (
    select 1 from public.deliveries
    where courier_id = v_caller and status in ('accepted', 'picked_up', 'in_transit')
  ) then
    raise exception 'Ya tienes un viaje en curso' using errcode = '23514';
  end if;

  select * into v_delivery from public.deliveries where id = p_delivery_id for update;

  if not found then
    raise exception 'Viaje no encontrado' using errcode = 'P0002';
  end if;

  if v_delivery.status <> 'offered' then
    raise exception 'Este viaje ya lo tomó otro repartidor' using errcode = '23514';
  end if;

  update public.deliveries
  set status = 'accepted', courier_id = v_caller, accepted_at = now()
  where id = p_delivery_id
  returning * into v_delivery;

  perform public.notify(
    (select pyme_id from public.orders where id = v_delivery.order_id),
    'delivery_accepted', 'Repartidor asignado',
    'Un repartidor va en camino a retirar el pedido.',
    '/app/pedidos/' || v_delivery.order_id);

  return v_delivery;
end;
$$;

-- -----------------------------------------------------------------------------
-- Avanzar un viaje, arrastrando al pedido con él.
-- -----------------------------------------------------------------------------
create or replace function public.advance_delivery(
  p_delivery_id uuid,
  p_status public.delivery_status,
  p_photo_url text default null
) returns public.deliveries
  language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_delivery public.deliveries;
  v_allowed public.delivery_status[];
  v_order_status public.order_status;
begin
  select * into v_delivery from public.deliveries where id = p_delivery_id for update;

  if not found then
    raise exception 'Viaje no encontrado' using errcode = 'P0002';
  end if;

  if v_delivery.courier_id <> v_caller and not public.is_admin() then
    raise exception 'Este viaje no es tuyo' using errcode = '42501';
  end if;

  v_allowed := case v_delivery.status
    when 'accepted'   then array['picked_up', 'cancelled']::public.delivery_status[]
    when 'picked_up'  then array['in_transit', 'delivered']::public.delivery_status[]
    when 'in_transit' then array['delivered']::public.delivery_status[]
    else array[]::public.delivery_status[]
  end;

  if not (p_status = any (v_allowed)) then
    raise exception 'No se puede pasar de % a %', v_delivery.status, p_status using errcode = '23514';
  end if;

  -- Entregar sin foto no vale: es el respaldo de que el paquete llegó.
  if p_status = 'delivered' and coalesce(p_photo_url, v_delivery.delivery_photo_url) is null then
    raise exception 'La entrega necesita una foto de confirmación' using errcode = '23514';
  end if;

  update public.deliveries set
    status = p_status,
    pickup_photo_url   = case when p_status = 'picked_up' then coalesce(p_photo_url, pickup_photo_url) else pickup_photo_url end,
    delivery_photo_url = case when p_status = 'delivered' then coalesce(p_photo_url, delivery_photo_url) else delivery_photo_url end,
    picked_up_at = case when p_status = 'picked_up' then now() else picked_up_at end,
    delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
    cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_delivery_id
  returning * into v_delivery;

  v_order_status := case p_status
    when 'picked_up'  then 'picked_up'::public.order_status
    when 'in_transit' then 'in_transit'::public.order_status
    when 'delivered'  then 'delivered'::public.order_status
    else null
  end;

  if v_order_status is not null then
    perform public.apply_order_status(
      v_delivery.order_id, v_order_status, p_photo_url,
      'Viaje ' || v_delivery.code, v_caller);
  end if;

  if p_status = 'delivered' then
    update public.courier_profiles
    set trips_count = trips_count + 1
    where profile_id = v_caller;
  end if;

  -- Un viaje cancelado por el repartidor vuelve a la bolsa de ofertas.
  if p_status = 'cancelled' then
    perform public.request_courier(v_delivery.order_id);
  end if;

  return v_delivery;
end;
$$;
