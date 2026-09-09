-- =============================================================================
-- BodGo · Row Level Security.
--
-- Regla general: cada quien ve lo suyo. La PyME ve sus contratos, envíos,
-- productos y pedidos; el bodeguero ve lo que pasa por sus espacios; el admin
-- ve todo. Nada queda abierto por omisión — toda tabla lleva RLS activo, y lo
-- que no tiene política no se lee.
--
-- Lo que sí es público (el buscador de bodegas, el nombre de un bodeguero) se
-- sirve por vistas que exponen sólo las columnas seguras. Ver el final.
-- =============================================================================

alter table public.profiles                  enable row level security;
alter table public.pyme_profiles             enable row level security;
alter table public.bodeguero_profiles        enable row level security;
alter table public.notification_preferences  enable row level security;
alter table public.warehouses                enable row level security;
alter table public.warehouse_photos          enable row level security;
alter table public.warehouse_checklist       enable row level security;
alter table public.contracts                 enable row level security;
alter table public.payment_methods           enable row level security;
alter table public.payments                  enable row level security;
alter table public.payouts                   enable row level security;
alter table public.payout_items              enable row level security;
alter table public.products                  enable row level security;
alter table public.inventory                 enable row level security;
alter table public.stock_movements           enable row level security;
alter table public.stock_counts              enable row level security;
alter table public.shipments                 enable row level security;
alter table public.shipment_items            enable row level security;
alter table public.discrepancies             enable row level security;
alter table public.discrepancy_notes         enable row level security;
alter table public.orders                    enable row level security;
alter table public.order_items               enable row level security;
alter table public.order_events              enable row level security;
alter table public.conversations             enable row level security;
alter table public.messages                  enable row level security;
alter table public.tickets                   enable row level security;
alter table public.ticket_notes              enable row level security;
alter table public.notifications             enable row level security;
alter table public.incidents                 enable row level security;
alter table public.incident_notes            enable row level security;
alter table public.leads                     enable row level security;

-- -----------------------------------------------------------------------------
-- Identidad
-- -----------------------------------------------------------------------------
create policy "perfil propio o admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "edito mi perfil" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- El rol no se cambia desde el cliente: lo fija handle_new_user() y sólo un
-- admin puede promover a otro rol desde la base.
create policy "admin gestiona perfiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "datos pyme propios" on public.pyme_profiles
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- El bodeguero necesita el contacto de la PyME que tiene mercadería en su
-- espacio; nadie más.
create policy "bodeguero ve a su pyme" on public.pyme_profiles
  for select using (exists (
    select 1 from public.contracts c
    join public.warehouses w on w.id = c.warehouse_id
    where c.pyme_id = public.pyme_profiles.profile_id
      and w.bodeguero_id = auth.uid()
      and c.status in ('pending_payment', 'active', 'ended')
  ));

create policy "datos bodeguero propios" on public.bodeguero_profiles
  for all using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create policy "pyme ve a su bodeguero" on public.bodeguero_profiles
  for select using (exists (
    select 1 from public.contracts c
    join public.warehouses w on w.id = c.warehouse_id
    where w.bodeguero_id = public.bodeguero_profiles.profile_id
      and c.pyme_id = auth.uid()
      and c.status in ('pending_payment', 'active', 'ended')
  ));

create policy "mis preferencias" on public.notification_preferences
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Microbodegas
--
-- La tabla queda cerrada: dueño, PyME con contrato y admin. El buscador
-- público no lee de acá sino de la vista `warehouse_listings`, que no trae la
-- dirección exacta.
-- -----------------------------------------------------------------------------
create policy "bodeguero gestiona sus espacios" on public.warehouses
  for all using (bodeguero_id = auth.uid() or public.is_admin())
  with check (bodeguero_id = auth.uid() or public.is_admin());

create policy "pyme con contrato ve la bodega" on public.warehouses
  for select using (exists (
    select 1 from public.contracts c
    where c.warehouse_id = public.warehouses.id
      and c.pyme_id = auth.uid()
      and c.status in ('pending_payment', 'active')
  ));

create policy "fotos de bodegas activas" on public.warehouse_photos
  for select using (exists (
    select 1 from public.warehouses w
    where w.id = warehouse_id and (w.status = 'active' or w.bodeguero_id = auth.uid())
  ) or public.is_admin());

create policy "bodeguero gestiona sus fotos" on public.warehouse_photos
  for all using (public.owns_warehouse(warehouse_id) or public.is_admin())
  with check (public.owns_warehouse(warehouse_id) or public.is_admin());

create policy "checklist del dueño y del admin" on public.warehouse_checklist
  for select using (public.owns_warehouse(warehouse_id) or public.is_admin());

create policy "admin marca el checklist" on public.warehouse_checklist
  for update using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Contratos y plata
-- -----------------------------------------------------------------------------
create policy "contratos de las partes" on public.contracts
  for select using (
    pyme_id = auth.uid() or public.owns_warehouse(warehouse_id) or public.is_admin()
  );

-- Crear y terminar contratos pasa por create_contract() / terminate_contract().
create policy "admin gestiona contratos" on public.contracts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "mis medios de pago" on public.payment_methods
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "mis pagos" on public.payments
  for select using (pyme_id = auth.uid() or public.is_admin());

create policy "mis liquidaciones" on public.payouts
  for select using (bodeguero_id = auth.uid() or public.is_admin());

create policy "detalle de mis liquidaciones" on public.payout_items
  for select using (exists (
    select 1 from public.payouts p
    where p.id = payout_id and (p.bodeguero_id = auth.uid() or public.is_admin())
  ));

-- -----------------------------------------------------------------------------
-- Catálogo e inventario
-- -----------------------------------------------------------------------------
create policy "mis productos" on public.products
  for all using (pyme_id = auth.uid() or public.is_admin())
  with check (pyme_id = auth.uid() or public.is_admin());

-- El bodeguero ve la ficha de lo que guarda, para poder contarlo y buscarlo.
create policy "bodeguero ve lo que almacena" on public.products
  for select using (exists (
    select 1 from public.inventory i
    join public.warehouses w on w.id = i.warehouse_id
    where i.product_id = public.products.id and w.bodeguero_id = auth.uid()
  ) or exists (
    select 1 from public.shipment_items si
    join public.shipments s on s.id = si.shipment_id
    join public.warehouses w on w.id = s.warehouse_id
    where si.product_id = public.products.id and w.bodeguero_id = auth.uid()
  ));

create policy "inventario de las partes" on public.inventory
  for select using (
    public.owns_warehouse(warehouse_id)
    or exists (select 1 from public.products p where p.id = product_id and p.pyme_id = auth.uid())
    or public.is_admin()
  );

create policy "bodeguero ajusta el inventario de su espacio" on public.inventory
  for update using (public.owns_warehouse(warehouse_id) or public.is_admin())
  with check (public.owns_warehouse(warehouse_id) or public.is_admin());

create policy "movimientos de las partes" on public.stock_movements
  for select using (
    public.owns_warehouse(warehouse_id)
    or exists (select 1 from public.products p where p.id = product_id and p.pyme_id = auth.uid())
    or public.is_admin()
  );

create policy "conteos de las partes" on public.stock_counts
  for select using (
    public.owns_warehouse(warehouse_id)
    or exists (select 1 from public.products p where p.id = product_id and p.pyme_id = auth.uid())
    or public.is_admin()
  );

create policy "bodeguero registra conteos" on public.stock_counts
  for insert with check (public.owns_warehouse(warehouse_id));

-- -----------------------------------------------------------------------------
-- Envíos y conciliación
-- -----------------------------------------------------------------------------
create policy "envíos de las partes" on public.shipments
  for select using (
    pyme_id = auth.uid() or public.owns_warehouse(warehouse_id) or public.is_admin()
  );

create policy "la pyme arma su envío" on public.shipments
  for insert with check (pyme_id = auth.uid());

-- Sólo mientras esté en borrador: una vez despachado lo mueven los RPC.
create policy "la pyme edita el borrador" on public.shipments
  for update using (pyme_id = auth.uid() and status in ('draft', 'ready'))
  with check (pyme_id = auth.uid());

create policy "la pyme borra el borrador" on public.shipments
  for delete using (pyme_id = auth.uid() and status = 'draft');

create policy "manifiesto de las partes" on public.shipment_items
  for select using (exists (
    select 1 from public.shipments s
    where s.id = shipment_id
      and (s.pyme_id = auth.uid() or public.owns_warehouse(s.warehouse_id) or public.is_admin())
  ));

create policy "la pyme arma el manifiesto" on public.shipment_items
  for all using (exists (
    select 1 from public.shipments s
    where s.id = shipment_id and s.pyme_id = auth.uid() and s.status in ('draft', 'ready')
  )) with check (exists (
    select 1 from public.shipments s
    where s.id = shipment_id and s.pyme_id = auth.uid() and s.status in ('draft', 'ready')
  ));

create policy "discrepancias de las partes" on public.discrepancies
  for select using (exists (
    select 1 from public.shipments s
    where s.id = shipment_id
      and (s.pyme_id = auth.uid() or public.owns_warehouse(s.warehouse_id) or public.is_admin())
  ));

create policy "admin resuelve discrepancias" on public.discrepancies
  for update using (public.is_admin()) with check (public.is_admin());

create policy "notas de discrepancia de las partes" on public.discrepancy_notes
  for select using (exists (
    select 1 from public.discrepancies d
    join public.shipments s on s.id = d.shipment_id
    where d.id = discrepancy_id
      and (s.pyme_id = auth.uid() or public.owns_warehouse(s.warehouse_id) or public.is_admin())
  ));

create policy "las partes comentan la discrepancia" on public.discrepancy_notes
  for insert with check (author_id = auth.uid() and exists (
    select 1 from public.discrepancies d
    join public.shipments s on s.id = d.shipment_id
    where d.id = discrepancy_id
      and (s.pyme_id = auth.uid() or public.owns_warehouse(s.warehouse_id) or public.is_admin())
  ));

-- -----------------------------------------------------------------------------
-- Pedidos de salida
-- -----------------------------------------------------------------------------
create policy "pedidos de las partes" on public.orders
  for select using (
    pyme_id = auth.uid() or public.owns_warehouse(warehouse_id) or public.is_admin()
  );

create policy "la pyme crea pedidos" on public.orders
  for insert with check (pyme_id = auth.uid());

create policy "la pyme edita el pedido pendiente" on public.orders
  for update using (pyme_id = auth.uid() and status in ('pending', 'queued'))
  with check (pyme_id = auth.uid());

create policy "líneas del pedido de las partes" on public.order_items
  for select using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.pyme_id = auth.uid() or public.owns_warehouse(o.warehouse_id) or public.is_admin())
  ));

create policy "la pyme arma las líneas" on public.order_items
  for all using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.pyme_id = auth.uid() and o.status in ('pending', 'queued')
  )) with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.pyme_id = auth.uid() and o.status in ('pending', 'queued')
  ));

-- El bodeguero marca líneas como pickeadas mientras arma el pedido.
create policy "bodeguero marca el picking" on public.order_items
  for update using (exists (
    select 1 from public.orders o
    where o.id = order_id and public.owns_warehouse(o.warehouse_id) and o.status in ('queued', 'picking')
  )) with check (exists (
    select 1 from public.orders o where o.id = order_id and public.owns_warehouse(o.warehouse_id)
  ));

create policy "trazabilidad de las partes" on public.order_events
  for select using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.pyme_id = auth.uid() or public.owns_warehouse(o.warehouse_id) or public.is_admin())
  ));

-- -----------------------------------------------------------------------------
-- Mensajería y soporte
-- -----------------------------------------------------------------------------
create policy "mis conversaciones" on public.conversations
  for select using (pyme_id = auth.uid() or bodeguero_id = auth.uid() or public.is_admin());

create policy "abro conversación como parte" on public.conversations
  for insert with check (pyme_id = auth.uid() or bodeguero_id = auth.uid());

create policy "mensajes de mis conversaciones" on public.messages
  for select using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.pyme_id = auth.uid() or c.bodeguero_id = auth.uid() or public.is_admin())
  ));

create policy "escribo en mis conversaciones" on public.messages
  for insert with check (sender_id = auth.uid() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.pyme_id = auth.uid() or c.bodeguero_id = auth.uid())
  ));

create policy "marco leídos mis mensajes" on public.messages
  for update using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.pyme_id = auth.uid() or c.bodeguero_id = auth.uid())
  )) with check (true);

create policy "mis tickets" on public.tickets
  for select using (opened_by = auth.uid() or public.is_admin());

create policy "abro tickets" on public.tickets
  for insert with check (opened_by = auth.uid());

create policy "admin gestiona tickets" on public.tickets
  for update using (public.is_admin()) with check (public.is_admin());

create policy "notas de mis tickets" on public.ticket_notes
  for select using (exists (
    select 1 from public.tickets t
    where t.id = ticket_id and (t.opened_by = auth.uid() or public.is_admin())
  ));

create policy "comento mis tickets" on public.ticket_notes
  for insert with check (author_id = auth.uid() and exists (
    select 1 from public.tickets t
    where t.id = ticket_id and (t.opened_by = auth.uid() or public.is_admin())
  ));

create policy "mis notificaciones" on public.notifications
  for select using (user_id = auth.uid());

create policy "marco leídas mis notificaciones" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Backoffice
-- -----------------------------------------------------------------------------
create policy "incidentes sólo admin" on public.incidents
  for all using (public.is_admin()) with check (public.is_admin());

create policy "notas de incidente sólo admin" on public.incident_notes
  for all using (public.is_admin()) with check (public.is_admin());

-- Único punto donde escribe un visitante sin cuenta: el formulario de la web.
create policy "cualquiera deja su contacto" on public.leads
  for insert to anon, authenticated with check (true);

create policy "leads sólo admin" on public.leads
  for select using (public.is_admin());

-- =============================================================================
-- Vistas públicas.
--
-- Corren con los permisos del dueño (security_invoker = off) a propósito: son
-- una proyección deliberadamente pública de tablas que por RLS están cerradas.
-- Por eso listan las columnas una a una — nunca `select *` — y no incluyen
-- dirección exacta, RUT, teléfono ni correo.
-- =============================================================================

/** Nombre y avatar de cualquier usuario, para mostrar contrapartes. */
create view public.public_profiles
  with (security_invoker = off) as
  select id, role, full_name, avatar_url, verified, created_at
  from public.profiles;

comment on view public.public_profiles is
  'Proyección pública de profiles: sólo nombre, rol, avatar y verificación. El contacto vive en pyme_profiles / bodeguero_profiles, que sí están cerrados por RLS.';

/** El buscador de microbodegas. Sector aproximado, nunca calle y número. */
create view public.warehouse_listings
  with (security_invoker = off) as
  select
    w.id,
    w.code,
    w.bodeguero_id,
    p.full_name    as bodeguero_name,
    p.avatar_url   as bodeguero_avatar,
    b.rating       as bodeguero_rating,
    w.comuna,
    w.region,
    w.sector_label,
    w.address_reference,
    w.lat,
    w.lng,
    w.total_m2,
    w.capacity_m3,
    w.price_per_m2,
    w.access_24_7,
    w.services,
    w.description,
    w.rating,
    w.ratings_count,
    w.published_at,
    coalesce(w.total_m2 - c.taken_m2, w.total_m2) as available_m2,
    case when w.total_m2 > 0
         then round((c.taken_m2 / w.total_m2) * 100)::int
         else 0 end as occupancy_pct
  from public.warehouses w
  join public.profiles p on p.id = w.bodeguero_id
  left join public.bodeguero_profiles b on b.profile_id = w.bodeguero_id
  left join lateral (
    select coalesce(sum(ct.m2), 0) as taken_m2
    from public.contracts ct
    where ct.warehouse_id = w.id and ct.status in ('pending_payment', 'active')
  ) c on true
  where w.status = 'active';

comment on view public.warehouse_listings is
  'Buscador público de microbodegas. Omite `address` a propósito: la dirección exacta se muestra recién con el contrato firmado.';

revoke all on public.public_profiles from public;
revoke all on public.warehouse_listings from public;
grant select on public.public_profiles to anon, authenticated;
grant select on public.warehouse_listings to anon, authenticated;
