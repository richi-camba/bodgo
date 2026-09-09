-- =============================================================================
-- BodGo · permisos del último tramo.
--
-- Un repartidor ve las ofertas a nivel de comuna y nada más. La dirección de
-- retiro, el nombre del comprador y su dirección exacta aparecen recién cuando
-- el viaje es suyo — la misma regla que ya rige la dirección de una bodega.
-- =============================================================================

alter table public.courier_profiles enable row level security;
alter table public.deliveries       enable row level security;

-- -----------------------------------------------------------------------------
-- Helpers. SECURITY DEFINER por lo mismo de siempre: se consultan desde las
-- políticas de las tablas que consultan.
-- -----------------------------------------------------------------------------

/** ¿El repartidor tiene un viaje vivo que retira en esta bodega? */
create or replace function public.courier_picks_up_at(warehouse uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.deliveries d
    where d.warehouse_id = warehouse
      and d.courier_id = auth.uid()
      and d.status in ('accepted', 'picked_up', 'in_transit')
  );
$$;

/** ¿El repartidor lleva (o llevó) este pedido? */
create or replace function public.courier_carries_order(target_order uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.deliveries d
    where d.order_id = target_order
      and d.courier_id = auth.uid()
      and d.status <> 'cancelled'
  );
$$;

-- -----------------------------------------------------------------------------
-- Perfil del repartidor
-- -----------------------------------------------------------------------------
create policy "mi perfil de repartidor" on public.courier_profiles
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- La PyME y el bodeguero necesitan poder llamar al repartidor que tiene su
-- paquete en la mochila; nadie más.
create policy "las partes ven al repartidor de su viaje" on public.courier_profiles
  for select using (exists (
    select 1 from public.deliveries d
    join public.orders o on o.id = d.order_id
    where d.courier_id = public.courier_profiles.profile_id
      and d.status in ('accepted', 'picked_up', 'in_transit')
      and (o.pyme_id = auth.uid() or public.owns_warehouse(d.warehouse_id))
  ));

-- -----------------------------------------------------------------------------
-- Viajes
--
-- Los viajes ofrecidos y sin dueño no aparecen acá: se leen por la vista
-- `delivery_offers`, que recorta las columnas sensibles.
-- -----------------------------------------------------------------------------
create policy "viajes de las partes" on public.deliveries
  for select using (
    courier_id = auth.uid()
    or public.owns_warehouse(warehouse_id)
    or exists (select 1 from public.orders o where o.id = order_id and o.pyme_id = auth.uid())
    or public.is_admin()
  );

create policy "admin gestiona viajes" on public.deliveries
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Lo que el repartidor necesita ver una vez que el viaje es suyo
-- -----------------------------------------------------------------------------
create policy "repartidor ve la bodega de retiro" on public.warehouses
  for select using (public.courier_picks_up_at(id));

create policy "repartidor ve el pedido que lleva" on public.orders
  for select using (public.courier_carries_order(id));

create policy "repartidor ve la trazabilidad de su pedido" on public.order_events
  for select using (public.courier_carries_order(order_id));

-- =============================================================================
-- Bolsa de viajes disponibles.
--
-- Vista con los permisos del dueño, como el buscador de bodegas: expone sólo
-- comuna, distancia y pago. Además se filtra a sí misma — sólo devuelve filas
-- si quien pregunta es un repartidor en línea —, así estar fuera de línea
-- significa de verdad no recibir ofertas.
-- =============================================================================
create view public.delivery_offers
  with (security_invoker = off) as
  select
    d.id,
    d.code,
    d.zone,
    d.distance_km,
    d.eta_minutes,
    d.courier_fee,
    d.offered_at,
    o.code            as order_code,
    o.buyer_comuna    as dropoff_comuna,
    w.comuna          as pickup_comuna,
    w.sector_label    as pickup_sector
  from public.deliveries d
  join public.orders o     on o.id = d.order_id
  join public.warehouses w on w.id = d.warehouse_id
  where d.status = 'offered'
    and exists (
      select 1 from public.courier_profiles c
      where c.profile_id = auth.uid() and c.is_online
    );

comment on view public.delivery_offers is
  'Bolsa de viajes para repartidores en línea. Sin direcciones exactas ni datos del comprador: eso aparece al aceptar.';

revoke all on public.delivery_offers from public;
grant select on public.delivery_offers to authenticated;
