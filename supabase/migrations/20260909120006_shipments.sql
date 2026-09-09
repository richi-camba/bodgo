-- =============================================================================
-- BodGo · envíos a bodega y conciliación de recepción.
--
-- El envío lleva un manifiesto: la PyME declara SKU por SKU qué manda y cuánto.
-- El bodeguero cuenta contra esa lista y mide el volumen real. Si algo no
-- calza — en unidades o en m³ — se abre una discrepancia y la plata sigue en
-- custodia hasta que se resuelva.
-- =============================================================================

create table public.shipments (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default ('ENV-' || nextval('public.shipment_code_seq')),
  pyme_id       uuid not null references public.profiles (id) on delete cascade,
  warehouse_id  uuid not null references public.warehouses (id) on delete restrict,
  contract_id   uuid references public.contracts (id) on delete set null,

  description     text,
  packages_count  integer not null default 1 check (packages_count > 0),
  weight_kg       numeric(7,2) check (weight_kg >= 0),
  pickup_address  text,
  method          public.shipment_method not null default 'own',

  declared_volume_m3 numeric(8,2) not null default 0 check (declared_volume_m3 >= 0),
  received_volume_m3 numeric(8,2) check (received_volume_m3 >= 0),
  -- Capacidad del contrato al momento del envío, congelada para la auditoría.
  capacity_m3        numeric(8,2),

  status        public.shipment_status not null default 'draft',
  dispatch_photo_url  text,
  reception_photo_url text,
  host_note     text,

  dispatched_at timestamptz,
  received_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index shipments_pyme_idx      on public.shipments (pyme_id, status);
create index shipments_warehouse_idx on public.shipments (warehouse_id, status);

create trigger shipments_touch before update on public.shipments
  for each row execute function public.touch_updated_at();

-- Líneas del manifiesto. Se guarda copia del nombre, SKU y volumen unitario:
-- si la PyME después renombra el producto, el manifiesto histórico no cambia.
create table public.shipment_items (
  id             uuid primary key default gen_random_uuid(),
  shipment_id    uuid not null references public.shipments (id) on delete cascade,
  product_id     uuid not null references public.products (id) on delete restrict,
  sku            text not null,
  name           text not null,
  category       text,
  unit_volume_m3 numeric(8,4) not null default 0,
  declared_qty   integer not null check (declared_qty > 0),
  received_qty   integer check (received_qty >= 0),
  unique (shipment_id, product_id)
);

create index shipment_items_shipment_idx on public.shipment_items (shipment_id);

-- Mantiene `declared_volume_m3` al día con las líneas del manifiesto, para que
-- el chequeo de capacidad no dependa de que el cliente lo recalcule.
create or replace function public.refresh_shipment_volume() returns trigger
  language plpgsql as $$
declare
  target uuid := coalesce(new.shipment_id, old.shipment_id);
begin
  update public.shipments s
  set declared_volume_m3 = coalesce((
        select round(sum(i.unit_volume_m3 * i.declared_qty)::numeric, 2)
        from public.shipment_items i where i.shipment_id = target
      ), 0)
  where s.id = target;
  return null;
end;
$$;

create trigger shipment_items_refresh_volume
  after insert or update or delete on public.shipment_items
  for each row execute function public.refresh_shipment_volume();

-- -----------------------------------------------------------------------------
-- Discrepancias de recepción.
-- -----------------------------------------------------------------------------
create table public.discrepancies (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default ('DIS-' || nextval('public.discrepancy_code_seq')),
  shipment_id   uuid not null references public.shipments (id) on delete cascade,
  type          public.discrepancy_type not null,
  status        public.discrepancy_status not null default 'open',

  declared_units integer not null default 0,
  received_units integer not null default 0,
  units_short    integer not null default 0,
  units_over     integer not null default 0,

  declared_m3   numeric(8,2),
  received_m3   numeric(8,2),
  capacity_m3   numeric(8,2),
  excess_m3     numeric(8,2),

  host_note          text,
  evidence_photo_url text,
  resolution    text,
  resolved_by   uuid references public.profiles (id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index discrepancies_shipment_idx on public.discrepancies (shipment_id);
create index discrepancies_status_idx   on public.discrepancies (status) where status <> 'resolved';

create trigger discrepancies_touch before update on public.discrepancies
  for each row execute function public.touch_updated_at();

create table public.discrepancy_notes (
  id              uuid primary key default gen_random_uuid(),
  discrepancy_id  uuid not null references public.discrepancies (id) on delete cascade,
  author_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create index discrepancy_notes_parent_idx on public.discrepancy_notes (discrepancy_id, created_at);
