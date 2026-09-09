-- =============================================================================
-- El último tramo va por courier externo.
--
-- La app de repartidor propio no existe en el producto: el prototipo la marcaba
-- «Próximamente» y su navegador sólo listaba App PyME y App Bodeguero. Quien
-- entrega es Chilexpress, Starken, Uber Flash o quien la PyME contrate, y lo
-- que BodGo hace es registrar con quién se despachó, guardar el comprobante y
-- darle al comprador un enlace para seguir su pedido.
--
-- Esta migración deshace la flota propia y deja en su lugar el seguimiento.
-- =============================================================================

drop view if exists public.delivery_offers;

-- Las políticas primero: dependen de los helpers que vienen abajo.
drop policy if exists "repartidor ve la bodega de retiro" on public.warehouses;
drop policy if exists "repartidor ve el pedido que lleva" on public.orders;
drop policy if exists "repartidor ve la trazabilidad de su pedido" on public.order_events;

drop function if exists public.accept_delivery(uuid);
drop function if exists public.advance_delivery(uuid, public.delivery_status, text);
drop function if exists public.set_courier_online(boolean);
drop function if exists public.request_courier(uuid);
drop function if exists public.courier_picks_up_at(uuid);
drop function if exists public.courier_carries_order(uuid);
drop function if exists public.courier_commission_rate();

-- `courier_profiles` primero: su política de lectura consulta `deliveries`.
drop table if exists public.courier_profiles cascade;
drop table if exists public.deliveries cascade;
drop sequence if exists public.delivery_code_seq;

drop type if exists public.delivery_status;
drop type if exists public.vehicle_type;

-- El valor 'repartidor' de `user_role` queda inerte: sacarlo obligaría a
-- recrear el tipo y con él cada columna que lo usa, y no hay forma de llegar a
-- él (handle_new_user ya no lo asigna). Se deja reservado por si algún día
-- BodGo integra una flota.
comment on type public.user_role is
  'Roles del producto. «repartidor» está reservado y no se puede pedir desde el registro: hoy la entrega la hace un courier externo.';

-- Antes se llamaba 'bodgo_courier' por la flota propia. Ahora nombra lo que
-- realmente sería: un courier integrado a la plataforma vía API — Cabify o
-- similar — en vez de uno que la PyME coordina por fuera.
alter type public.delivery_method rename value 'bodgo_courier' to 'integrated_courier';

-- -----------------------------------------------------------------------------
-- El registro de quién despachó.
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists courier_cost integer check (courier_cost >= 0);

comment on column public.orders.shipping_cost is
  'Lo que se le cobra al comprador por el envío, según la zona de su comuna.';
comment on column public.orders.courier_cost is
  'Lo que la PyME le pagó de verdad al courier. La diferencia con shipping_cost es su margen (o su pérdida) en el despacho.';

-- -----------------------------------------------------------------------------
-- Seguimiento público del comprador.
--
-- El comprador no tiene cuenta: llega por un enlace. El código del pedido
-- (DSP-3406) es correlativo y adivinable, así que el enlace va con un token
-- aleatorio propio — sin él no se llega a nada.
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists tracking_token uuid not null default gen_random_uuid();

create unique index if not exists orders_tracking_token_idx on public.orders (tracking_token);

/**
 * Estado de un pedido para el comprador que abre su enlace.
 *
 * SECURITY DEFINER porque quien llama es un anónimo sin fila que le
 * corresponda en RLS. Devuelve sólo lo que el comprador ya sabe de su propia
 * compra: qué pidió, a dónde va y por dónde viene. Nada de la PyME, nada de la
 * bodega salvo la comuna, y ninguna dirección que no sea la suya.
 */
create or replace function public.track_order(p_token uuid)
returns table (
  code text,
  status public.order_status,
  buyer_name text,
  buyer_address text,
  buyer_comuna text,
  delivery_notes text,
  items_total integer,
  shipping_cost integer,
  total_amount integer,
  courier_name text,
  tracking_number text,
  tracking_url text,
  origin_comuna text,
  created_at timestamptz,
  delivered_at timestamptz,
  delivery_photo_url text
)
  language sql stable security definer set search_path = public as $$
  select
    o.code, o.status, o.buyer_name, o.buyer_address, o.buyer_comuna, o.delivery_notes,
    o.items_total, o.shipping_cost, o.total_amount,
    o.courier_name, o.tracking_number, o.tracking_url,
    w.comuna as origin_comuna,
    o.created_at, o.delivered_at, o.delivery_photo_url
  from public.orders o
  join public.warehouses w on w.id = o.warehouse_id
  where o.tracking_token = p_token;
$$;

/** Las líneas del pedido, para el mismo enlace. */
create or replace function public.track_order_items(p_token uuid)
returns table (sku text, name text, quantity integer, unit_price integer)
  language sql stable security definer set search_path = public as $$
  select i.sku, i.name, i.quantity, i.unit_price
  from public.order_items i
  join public.orders o on o.id = i.order_id
  where o.tracking_token = p_token;
$$;

/** La trazabilidad, sin quién hizo cada cosa. */
create or replace function public.track_order_events(p_token uuid)
returns table (status public.order_status, note text, created_at timestamptz)
  language sql stable security definer set search_path = public as $$
  select e.status, e.note, e.created_at
  from public.order_events e
  join public.orders o on o.id = e.order_id
  where o.tracking_token = p_token
  order by e.created_at;
$$;

grant execute on function public.track_order(uuid) to anon, authenticated;
grant execute on function public.track_order_items(uuid) to anon, authenticated;
grant execute on function public.track_order_events(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- El alta de cuenta vuelve a los dos roles del producto.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'pyme');
  assigned  public.user_role;
begin
  -- 'admin' y 'repartidor' no se pueden pedir desde el cliente.
  assigned := case when requested = 'bodeguero' then 'bodeguero'::public.user_role
                   else 'pyme'::public.user_role end;

  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    assigned,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  if assigned = 'pyme' then
    insert into public.pyme_profiles (profile_id, business_name, email)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''),
               nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
               split_part(new.email, '@', 1)),
      new.email
    );
  else
    insert into public.bodeguero_profiles (profile_id, email) values (new.id, new.email);
  end if;

  insert into public.notification_preferences (profile_id) values (new.id);

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- `advance_order` ya no tiene una flota a la que avisarle.
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

  -- Entregar al courier sin registrar con quién se despachó deja al comprador
  -- sin forma de seguir su pedido, que es justamente lo que promete el enlace.
  if p_status = 'picked_up'
     and v_order.delivery_method = 'external_courier'
     and coalesce(trim(v_order.courier_name), '') = '' then
    raise exception 'Registra el courier y el número de seguimiento antes de despachar'
      using errcode = '23514';
  end if;

  return public.apply_order_status(p_order_id, p_status, p_photo_url, p_note, v_caller);
end;
$$;
