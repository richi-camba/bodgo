-- =============================================================================
-- Corrige una recursión entre políticas y agrega la unicidad que faltaba en los
-- medios de pago.
--
-- La política de `products` preguntaba por `inventory`, y la de `inventory`
-- preguntaba por `products`: al evaluar una, Postgres entraba en la otra y de
-- vuelta. El resultado era que el bodeguero no veía la ficha de la mercadería
-- que tiene guardada.
--
-- La salida es la misma de siempre acá: encapsular la pregunta en una función
-- SECURITY DEFINER, que consulta la tabla sin volver a pasar por RLS.
-- =============================================================================

/** Dueño de un producto, sin pasar por la política de `products`. */
create or replace function public.product_owner(product uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select pyme_id from public.products where id = product;
$$;

/** ¿El bodeguero autenticado guarda (o va a recibir) este producto? */
create or replace function public.host_stores_product(product uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.inventory i
    join public.warehouses w on w.id = i.warehouse_id
    where i.product_id = product and w.bodeguero_id = auth.uid()
  ) or exists (
    select 1 from public.shipment_items si
    join public.shipments s on s.id = si.shipment_id
    join public.warehouses w on w.id = s.warehouse_id
    where si.product_id = product and w.bodeguero_id = auth.uid()
  );
$$;

drop policy "bodeguero ve lo que almacena" on public.products;
create policy "bodeguero ve lo que almacena" on public.products
  for select using (public.host_stores_product(id));

drop policy "inventario de las partes" on public.inventory;
create policy "inventario de las partes" on public.inventory
  for select using (
    public.owns_warehouse(warehouse_id)
    or public.product_owner(product_id) = auth.uid()
    or public.is_admin()
  );

drop policy "movimientos de las partes" on public.stock_movements;
create policy "movimientos de las partes" on public.stock_movements
  for select using (
    public.owns_warehouse(warehouse_id)
    or public.product_owner(product_id) = auth.uid()
    or public.is_admin()
  );

drop policy "conteos de las partes" on public.stock_counts;
create policy "conteos de las partes" on public.stock_counts
  for select using (
    public.owns_warehouse(warehouse_id)
    or public.product_owner(product_id) = auth.uid()
    or public.is_admin()
  );

-- Una tarjeta se guarda una sola vez por cuenta. Además le da a la carga de
-- datos un destino de conflicto sobre el cual hacer upsert.
create unique index payment_methods_unique_card
  on public.payment_methods (profile_id, last4);
