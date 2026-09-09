-- =============================================================================
-- BodGo · microbodegas de la red.
--
-- La dirección exacta es privada: en el buscador la PyME ve sólo el sector, y
-- la calle y número recién al firmar el contrato. Por eso el listado público
-- se sirve desde una vista que no incluye la columna `address`.
-- =============================================================================

create table public.warehouses (
  id                uuid primary key default gen_random_uuid(),
  bodeguero_id      uuid not null references public.profiles (id) on delete cascade,
  code              text not null unique default ('BOD-' || nextval('public.warehouse_code_seq')),

  comuna            text not null,
  region            text not null default 'Región Metropolitana',
  address           text not null,
  address_reference text,
  sector_label      text,
  lat               double precision,
  lng               double precision,

  total_m2          numeric(6,2) not null check (total_m2 > 0),
  price_per_m2      integer not null check (price_per_m2 > 0),

  status            public.warehouse_status not null default 'draft',
  access_24_7       boolean not null default false,
  services          text[] not null default '{}',
  description       text,
  rating            numeric(2,1) not null default 5.0 check (rating between 0 and 5),
  ratings_count     integer not null default 0,

  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Capacidad apilable, no volumen del recinto. Ver core/volume.ts.
  capacity_m3 numeric(7,2) generated always as (round(total_m2 * 1.8, 2)) stored
);

create index warehouses_bodeguero_idx on public.warehouses (bodeguero_id);
create index warehouses_comuna_idx    on public.warehouses (comuna) where status = 'active';
create index warehouses_status_idx    on public.warehouses (status);

create trigger warehouses_touch before update on public.warehouses
  for each row execute function public.touch_updated_at();

create table public.warehouse_photos (
  id           uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  storage_path text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index warehouse_photos_warehouse_idx on public.warehouse_photos (warehouse_id, sort_order);

-- Checklist de habilitación que BodGo verifica en la visita antes de publicar.
create table public.warehouse_checklist (
  id           uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  item         text not null,
  hint         text,
  status       text not null default 'pending' check (status in ('pending', 'ok', 'na', 'failed')),
  checked_by   uuid references public.profiles (id),
  checked_at   timestamptz,
  unique (warehouse_id, item)
);

-- Ítems que se crean solos al publicar un espacio nuevo.
create or replace function public.seed_warehouse_checklist() returns trigger
  language plpgsql as $$
begin
  insert into public.warehouse_checklist (warehouse_id, item, hint) values
    (new.id, 'Acceso independiente',   'Se puede entrar sin pasar por espacios privados'),
    (new.id, 'Superficie despejada',   'Piso libre, sin humedad ni filtraciones'),
    (new.id, 'Extintor vigente',       'Con carga al día y a la vista'),
    (new.id, 'Cierre seguro',          'Puerta con llave o candado propio'),
    (new.id, 'Documento del espacio',  'Certificado de dominio o contrato de arriendo')
  on conflict do nothing;
  return new;
end;
$$;

create trigger warehouses_seed_checklist after insert on public.warehouses
  for each row execute function public.seed_warehouse_checklist();
