-- -----------------------------------------------------------------------------
-- Las coordenadas del buscador van redondeadas.
--
-- `warehouse_listings` omite `address` a propósito —la calle y el número se
-- revelan con el contrato firmado— pero venía publicando `lat` y `lng`
-- exactos. Con eso la promesa no se sostiene: cualquiera puede pasar el par
-- por un geocodificador inverso y sacar la dirección igual.
--
-- Tres decimales son unos 110 metros: alcanza de sobra para ubicar el sector
-- en el mapa y para medir distancias entre comunas, y no alcanza para señalar
-- una casa. Las coordenadas exactas siguen en `warehouses`, que sólo ven el
-- dueño del espacio, el admin y la PyME con contrato vigente.
-- -----------------------------------------------------------------------------
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
    round(w.lat::numeric, 3) as lat,
    round(w.lng::numeric, 3) as lng,
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
  'Buscador público de microbodegas. Omite `address` y redondea las coordenadas a ~110 m: la ubicación exacta se revela con el contrato firmado.';

revoke all on public.warehouse_listings from public;
grant select on public.warehouse_listings to anon, authenticated;
