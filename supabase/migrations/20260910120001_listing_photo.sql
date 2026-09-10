-- =============================================================================
-- La foto principal entra al buscador.
--
-- Sin imagen las fichas se parecen todas entre sí y cuesta distinguir un
-- espacio de otro. La vista suma la primera foto del espacio; el resto de las
-- columnas queda igual, y la dirección exacta sigue afuera.
-- =============================================================================

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
    w.services,
    w.description,
    w.rating,
    w.ratings_count,
    w.published_at,
    coalesce(w.total_m2 - c.taken_m2, w.total_m2) as available_m2,
    case when w.total_m2 > 0
         then round((c.taken_m2 / w.total_m2) * 100)::int
         else 0 end as occupancy_pct,
    ph.storage_path as photo_path
  from public.warehouses w
  join public.profiles p on p.id = w.bodeguero_id
  left join public.bodeguero_profiles b on b.profile_id = w.bodeguero_id
  left join lateral (
    select coalesce(sum(ct.m2), 0) as taken_m2
    from public.contracts ct
    where ct.warehouse_id = w.id and ct.status in ('pending_payment', 'active')
  ) c on true
  left join lateral (
    select f.storage_path
    from public.warehouse_photos f
    where f.warehouse_id = w.id
    order by f.sort_order, f.created_at
    limit 1
  ) ph on true
  where w.status = 'active';

comment on view public.warehouse_listings is
  'Buscador público de microbodegas. Omite `address` a propósito: la dirección exacta se muestra recién con el contrato firmado.';

revoke all on public.warehouse_listings from public;
grant select on public.warehouse_listings to anon, authenticated;
