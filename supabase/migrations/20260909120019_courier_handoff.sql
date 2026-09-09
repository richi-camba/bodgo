-- =============================================================================
-- Registro del despacho con courier externo.
--
-- Lo hace quien entrega el paquete —la PyME o el bodeguero de la bodega de
-- origen— cuando el pedido ya está listo. Va por función y no por un UPDATE
-- directo porque la política de `orders` sólo deja a la PyME editar mientras el
-- pedido está pendiente, y esto pasa después.
-- =============================================================================

create or replace function public.register_courier(
  p_order_id uuid,
  p_courier_name text,
  p_tracking_number text default null,
  p_tracking_url text default null,
  p_courier_cost integer default null,
  p_receipt_url text default null
) returns public.orders
  language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'Pedido no encontrado' using errcode = 'P0002';
  end if;

  if v_order.pyme_id <> v_caller
     and not public.owns_warehouse(v_order.warehouse_id)
     and not public.is_admin() then
    raise exception 'No puedes registrar el despacho de este pedido' using errcode = '42501';
  end if;

  if coalesce(trim(p_courier_name), '') = '' then
    raise exception 'Indica con qué courier despachas' using errcode = '23514';
  end if;

  if v_order.status in ('pending', 'delivered', 'cancelled') then
    raise exception 'El pedido tiene que estar preparado para registrar el despacho'
      using errcode = '23514';
  end if;

  update public.orders set
    courier_name    = trim(p_courier_name),
    tracking_number = nullif(trim(p_tracking_number), ''),
    tracking_url    = nullif(trim(p_tracking_url), ''),
    courier_cost    = p_courier_cost,
    courier_receipt_url = coalesce(nullif(trim(p_receipt_url), ''), courier_receipt_url)
  where id = p_order_id
  returning * into v_order;

  insert into public.order_events (order_id, status, note, actor_id)
  values (
    p_order_id, v_order.status,
    'Despacho con ' || trim(p_courier_name)
      || coalesce(' · seguimiento ' || nullif(trim(p_tracking_number), ''), ''),
    v_caller
  );

  perform public.notify(v_order.pyme_id, 'courier_registered', 'Despacho registrado',
    'El pedido ' || v_order.code || ' va con ' || trim(p_courier_name) || '.',
    '/app/pedidos/' || p_order_id);

  return v_order;
end;
$$;
