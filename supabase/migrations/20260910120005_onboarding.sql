-- -----------------------------------------------------------------------------
-- Puesta en marcha de la cuenta.
--
-- `onboarded_at` marca que la persona ya pasó (o saltó) la bienvenida. Nulo
-- significa recién llegada, y el middleware la manda a completarla. Se guarda
-- la fecha y no un booleano porque después sirve para medir cuánto tarda
-- alguien entre registrarse y quedar operativo.
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'Cuándo terminó o saltó la bienvenida. Nulo = cuenta recién creada.';

-- Las cuentas que ya existen no tienen por qué pasar por la bienvenida.
update public.profiles set onboarded_at = created_at where onboarded_at is null;

-- -----------------------------------------------------------------------------
-- Horarios de recepción de la microbodega.
--
-- La pantalla de «contrato listo» venía mostrando un horario fijo, igual para
-- todas las bodegas, justo después de que la PyME paga. Ahora lo dice el
-- bodeguero: es la primera pregunta de quien tiene que ir a dejar los bultos.
-- -----------------------------------------------------------------------------
alter table public.warehouses
  add column reception_hours text,
  add column weekend_hours   text;

comment on column public.warehouses.reception_hours is
  'Horario de recepción en días hábiles, tal como lo escribe el bodeguero.';
comment on column public.warehouses.weekend_hours is
  'Horario de fin de semana. Nulo significa que no recibe sábado ni domingo.';

-- La vista pública tiene que mostrarlos: son parte de decidir si el espacio
-- sirve, no un dato que se revele recién con el contrato firmado.
drop view if exists public.warehouse_listings;

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
    w.reception_hours,
    w.weekend_hours,
    w.services,
    w.description,
    w.rating,
    w.ratings_count,
    w.published_at,
    ph.storage_path as photo_path,
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
  left join lateral (
    select wp.storage_path
    from public.warehouse_photos wp
    where wp.warehouse_id = w.id
    order by wp.sort_order
    limit 1
  ) ph on true
  where w.status = 'active';

comment on view public.warehouse_listings is
  'Buscador público de microbodegas. Omite `address` a propósito: la dirección exacta se muestra recién con el contrato firmado.';

revoke all on public.warehouse_listings from public;
grant select on public.warehouse_listings to anon, authenticated;
