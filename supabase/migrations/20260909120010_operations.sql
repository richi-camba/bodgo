-- =============================================================================
-- BodGo · operaciones transaccionales.
--
-- Todo lo que mueve plata o stock vive acá, no en el cliente. Un navegador que
-- se cae a la mitad no puede dejar un contrato cobrado sin custodia, ni una
-- recepción confirmada sin actualizar el inventario.
--
-- Son SECURITY DEFINER porque escriben en varias tablas con RLS; cada una
-- verifica por su cuenta que quien llama tenga derecho a hacerlo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Contratar una microbodega.
--
-- Cotiza contra el precio vigente de la bodega, cobra por adelantado y deja la
-- plata en custodia. Si el medio de pago rechaza, el contrato queda en
-- `pending_payment` y no se reserva nada.
-- -----------------------------------------------------------------------------
create or replace function public.create_contract(
  p_warehouse_id uuid,
  p_m2 numeric,
  p_payment_method_id uuid default null
) returns public.contracts
  language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_wh public.warehouses;
  v_available numeric;
  v_base integer;
  v_commission integer;
  v_contract public.contracts;
  v_card public.payment_methods;
  v_declined boolean := false;
begin
  if v_caller is null then
    raise exception 'Debes iniciar sesión para contratar' using errcode = '42501';
  end if;

  if (select role from public.profiles where id = v_caller) <> 'pyme' then
    raise exception 'Sólo una cuenta PyME puede contratar bodegas' using errcode = '42501';
  end if;

  select * into v_wh from public.warehouses where id = p_warehouse_id for update;

  if not found or v_wh.status <> 'active' then
    raise exception 'La microbodega no está disponible' using errcode = 'P0002';
  end if;

  -- m² ya comprometidos por contratos vigentes de cualquier PyME.
  select v_wh.total_m2 - coalesce(sum(c.m2), 0) into v_available
  from public.contracts c
  where c.warehouse_id = p_warehouse_id and c.status in ('pending_payment', 'active');

  if p_m2 <= 0 then
    raise exception 'La superficie debe ser mayor que cero' using errcode = '22023';
  end if;

  if p_m2 > v_available then
    raise exception 'Sólo quedan % m² disponibles en esta bodega', v_available using errcode = '23514';
  end if;

  v_base := round(p_m2 * v_wh.price_per_m2);
  v_commission := round(v_base * public.platform_commission_rate());

  insert into public.contracts (
    pyme_id, warehouse_id, m2, price_per_m2,
    base_amount, commission_amount, total_amount, status
  ) values (
    v_caller, p_warehouse_id, p_m2, v_wh.price_per_m2,
    v_base, v_commission, v_base + v_commission, 'pending_payment'
  ) returning * into v_contract;

  -- Cobro. Mientras no exista el convenio Transbank, el proveedor 'demo'
  -- rechaza la tarjeta terminada en 0002, igual que el prototipo.
  select * into v_card from public.payment_methods
  where id = p_payment_method_id and profile_id = v_caller;

  v_declined := v_card.id is null or (v_card.provider = 'demo' and v_card.last4 = '0002');

  if v_declined then
    insert into public.payments (contract_id, pyme_id, payment_method_id, amount, status, failure_reason)
    values (v_contract.id, v_caller, v_card.id, v_contract.total_amount, 'failed',
            case when v_card.id is null then 'Sin medio de pago' else 'Fondos insuficientes' end);

    perform public.notify(v_caller, 'payment_failed', 'Pago rechazado',
      'Tu medio de pago fue rechazado. No se realizó ningún cargo.',
      '/app/contratos/' || v_contract.id, true);

    return v_contract;
  end if;

  insert into public.payments (contract_id, pyme_id, payment_method_id, amount, status, held_at, provider)
  values (v_contract.id, v_caller, v_card.id, v_contract.total_amount, 'held', now(), v_card.provider);

  update public.contracts set
    status = 'active',
    start_date = current_date,
    next_charge_date = (current_date + interval '1 month')::date
  where id = v_contract.id
  returning * into v_contract;

  perform public.notify(v_caller, 'contract_active', 'Pago en custodia',
    'Reservaste ' || v_wh.comuna || ' (' || p_m2 || ' m²). Liberamos el pago al confirmar la recepción.',
    '/app/contratos/' || v_contract.id, true);

  perform public.notify(v_wh.bodeguero_id, 'contract_new', 'Nueva PyME en tu espacio',
    'Se contrataron ' || p_m2 || ' m² en ' || v_wh.comuna || '.',
    '/bodeguero/espacios', true);

  return v_contract;
end;
$$;

-- -----------------------------------------------------------------------------
-- Terminar un contrato antes de tiempo.
--
-- Prorratea sobre 30 días: el bodeguero cobra los días usados y el resto se
-- devuelve a la PyME desde la custodia.
-- -----------------------------------------------------------------------------
create or replace function public.terminate_contract(
  p_contract_id uuid,
  p_days_used integer
) returns public.contracts
  language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_contract public.contracts;
  v_days integer := greatest(0, least(30, p_days_used));
  v_host integer;
  v_refund integer;
begin
  select * into v_contract from public.contracts where id = p_contract_id for update;

  if not found then
    raise exception 'Contrato no encontrado' using errcode = 'P0002';
  end if;

  if v_contract.pyme_id <> v_caller and not public.is_admin() then
    raise exception 'No puedes terminar este contrato' using errcode = '42501';
  end if;

  if v_contract.status <> 'active' then
    raise exception 'El contrato no está activo' using errcode = '23514';
  end if;

  v_host := round((v_contract.base_amount::numeric / 30) * v_days);
  v_refund := greatest(0, v_contract.base_amount - v_host);

  update public.payments
  set status = 'refunded', refunded_at = now(), refund_amount = v_refund
  where contract_id = p_contract_id and status = 'held';

  update public.contracts set
    status = 'ended',
    ended_at = now(),
    termination_days_used = v_days,
    refund_amount = v_refund,
    next_charge_date = null
  where id = p_contract_id
  returning * into v_contract;

  perform public.notify(v_contract.pyme_id, 'contract_ended', 'Contrato finalizado',
    'Cancelamos el cobro recurrente. Tu devolución está en camino.',
    '/app/contratos/' || v_contract.id, true);

  perform public.notify(
    (select bodeguero_id from public.warehouses where id = v_contract.warehouse_id),
    'contract_ended', 'Contrato terminado',
    'Una PyME terminó su contrato. Se te pagan los ' || v_days || ' días usados.',
    '/bodeguero/pagos', true);

  return v_contract;
end;
$$;

-- -----------------------------------------------------------------------------
-- Confirmar la recepción de un envío.
--
-- Es la operación crítica del modelo. En una sola transacción:
--   1. registra el conteo real línea a línea,
--   2. suma al inventario lo efectivamente recibido (no lo declarado),
--   3. deja el rastro en el libro de movimientos,
--   4. abre una discrepancia si faltan unidades o si no cabe en los m²,
--   5. libera la custodia sólo si no hubo diferencias.
--
-- `p_counts` es un jsonb con la forma `[{"product_id": "...", "received": 8}]`.
-- Un producto del manifiesto que no venga en el arreglo se toma como recibido
-- completo — el bodeguero sólo corrige lo que no calza.
-- -----------------------------------------------------------------------------
create or replace function public.confirm_reception(
  p_shipment_id uuid,
  p_counts jsonb default '[]'::jsonb,
  p_received_volume_m3 numeric default null,
  p_photo_url text default null,
  p_note text default null
) returns public.shipments
  language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid := auth.uid();
  v_shipment public.shipments;
  v_capacity numeric;
  v_volume numeric;
  v_declared integer;
  v_received integer;
  v_short integer;
  v_over integer;
  v_mismatch integer;
  v_exceeds boolean;
  v_type public.discrepancy_type;
  v_item record;
begin
  select * into v_shipment from public.shipments where id = p_shipment_id for update;

  if not found then
    raise exception 'Envío no encontrado' using errcode = 'P0002';
  end if;

  if not public.owns_warehouse(v_shipment.warehouse_id) and not public.is_admin() then
    raise exception 'Sólo el bodeguero de destino puede confirmar la recepción' using errcode = '42501';
  end if;

  if v_shipment.status in ('received', 'discrepancy') then
    raise exception 'Este envío ya fue recibido' using errcode = '23514';
  end if;

  -- 1. Conteo real. Lo no corregido se asume igual a lo declarado.
  update public.shipment_items i
  set received_qty = coalesce(
    (select (c ->> 'received')::integer
     from jsonb_array_elements(p_counts) c
     where (c ->> 'product_id')::uuid = i.product_id
     limit 1),
    i.declared_qty
  )
  where i.shipment_id = p_shipment_id;

  select coalesce(sum(declared_qty), 0),
         coalesce(sum(received_qty), 0),
         coalesce(sum(greatest(0, declared_qty - received_qty)), 0),
         coalesce(sum(greatest(0, received_qty - declared_qty)), 0),
         count(*) filter (where received_qty <> declared_qty)
    into v_declared, v_received, v_short, v_over, v_mismatch
  from public.shipment_items where shipment_id = p_shipment_id;

  -- 2 y 3. Inventario y libro mayor, sobre lo recibido.
  for v_item in
    select product_id, received_qty from public.shipment_items
    where shipment_id = p_shipment_id and received_qty > 0
  loop
    insert into public.inventory (product_id, warehouse_id, quantity)
    values (v_item.product_id, v_shipment.warehouse_id, v_item.received_qty)
    on conflict (product_id, warehouse_id)
    do update set quantity = public.inventory.quantity + excluded.quantity, updated_at = now();

    insert into public.stock_movements (
      product_id, warehouse_id, type, quantity, reference_type, reference_id, note, created_by
    ) values (
      v_item.product_id, v_shipment.warehouse_id, 'inbound', v_item.received_qty,
      'shipment', p_shipment_id, 'Recepción ' || v_shipment.code, v_caller
    );
  end loop;

  -- 4. Chequeo de volumen contra la capacidad apilable del contrato.
  v_capacity := coalesce(
    v_shipment.capacity_m3,
    (select c.capacity_m3 from public.contracts c where c.id = v_shipment.contract_id),
    (select w.capacity_m3 from public.warehouses w where w.id = v_shipment.warehouse_id)
  );
  v_volume := coalesce(p_received_volume_m3, v_shipment.declared_volume_m3);
  v_exceeds := v_volume > v_capacity + 0.005;

  v_type := case
    when v_mismatch > 0 and v_exceeds then 'both'
    when v_mismatch > 0 then 'units'
    when v_exceeds then 'volume'
    else null
  end;

  update public.shipments set
    status = case when v_type is null then 'received' else 'discrepancy' end,
    received_at = now(),
    received_volume_m3 = v_volume,
    capacity_m3 = v_capacity,
    reception_photo_url = coalesce(p_photo_url, reception_photo_url),
    host_note = coalesce(p_note, host_note)
  where id = p_shipment_id
  returning * into v_shipment;

  if v_type is not null then
    insert into public.discrepancies (
      shipment_id, type, declared_units, received_units, units_short, units_over,
      declared_m3, received_m3, capacity_m3, excess_m3, host_note, evidence_photo_url, status
    ) values (
      p_shipment_id, v_type, v_declared, v_received, v_short, v_over,
      v_shipment.declared_volume_m3, v_volume, v_capacity,
      case when v_exceeds then round(v_volume - v_capacity, 2) else 0 end,
      p_note, p_photo_url, 'notified'
    );

    perform public.notify(v_shipment.pyme_id, 'reception_discrepancy',
      'Diferencia en la recepción',
      'El bodeguero registró una diferencia al recibir ' || v_shipment.code || '.',
      '/app/despachos/' || p_shipment_id, true);
  else
    -- 5. Sin diferencias: la custodia se libera.
    update public.payments
    set status = 'released', released_at = now()
    where contract_id = v_shipment.contract_id and status = 'held';

    perform public.notify(v_shipment.pyme_id, 'reception_ok', 'Mercancía recibida',
      'El bodeguero confirmó la recepción y registró la foto. Tu stock ya está en el inventario.',
      '/app/despachos/' || p_shipment_id, true);
  end if;

  return v_shipment;
end;
$$;

-- -----------------------------------------------------------------------------
-- Avanzar un pedido de salida.
--
-- Valida que la transición sea legal, descuenta el stock al empezar el picking
-- y deja el evento con foto.
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
  v_item record;
  v_stock integer;
begin
  select * into v_order from public.orders where id = p_order_id for update;

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
        'order', p_order_id, 'Picking ' || v_order.code, v_caller
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
  values (p_order_id, p_status, p_note, p_photo_url, v_caller);

  perform public.notify(v_order.pyme_id, 'order_' || p_status,
    'Pedido ' || v_order.code,
    case p_status
      when 'picking'    then 'El bodeguero está preparando el pedido.'
      when 'ready'      then 'El pedido está listo para retiro.'
      when 'in_transit' then 'El pedido va en camino al comprador.'
      when 'delivered'  then 'El comprador recibió su pedido.'
      else 'El pedido cambió de estado.'
    end,
    '/app/pedidos/' || p_order_id);

  return v_order;
end;
$$;

-- -----------------------------------------------------------------------------
-- Marcar un envío como despachado (la PyME lo entrega al courier o lo lleva).
-- -----------------------------------------------------------------------------
create or replace function public.dispatch_shipment(
  p_shipment_id uuid,
  p_photo_url text default null
) returns public.shipments
  language plpgsql security definer set search_path = public as $$
declare
  v_shipment public.shipments;
begin
  select * into v_shipment from public.shipments where id = p_shipment_id for update;

  if not found or (v_shipment.pyme_id <> auth.uid() and not public.is_admin()) then
    raise exception 'Envío no encontrado' using errcode = 'P0002';
  end if;

  if v_shipment.status not in ('draft', 'ready') then
    raise exception 'El envío ya fue despachado' using errcode = '23514';
  end if;

  if not exists (select 1 from public.shipment_items where shipment_id = p_shipment_id) then
    raise exception 'El manifiesto está vacío' using errcode = '23514';
  end if;

  update public.shipments set
    status = 'in_transit',
    dispatched_at = now(),
    dispatch_photo_url = coalesce(p_photo_url, dispatch_photo_url),
    capacity_m3 = coalesce(
      capacity_m3,
      (select c.capacity_m3 from public.contracts c where c.id = v_shipment.contract_id),
      (select w.capacity_m3 from public.warehouses w where w.id = v_shipment.warehouse_id)
    )
  where id = p_shipment_id
  returning * into v_shipment;

  perform public.notify(
    (select bodeguero_id from public.warehouses where id = v_shipment.warehouse_id),
    'shipment_incoming', 'Recepción de mercancía',
    'Viene en camino el envío ' || v_shipment.code || ' · ' || v_shipment.packages_count || ' bultos.',
    '/bodeguero/recepciones/' || p_shipment_id, true);

  return v_shipment;
end;
$$;
