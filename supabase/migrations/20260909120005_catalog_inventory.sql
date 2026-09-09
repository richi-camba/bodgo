-- =============================================================================
-- BodGo · catálogo de la PyME e inventario distribuido.
--
-- El stock no vive en el producto sino en el par (producto, bodega): la misma
-- PyME puede tener el mismo SKU repartido en varias microbodegas, y de ahí sale
-- la decisión de desde dónde despachar.
-- =============================================================================

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  pyme_id        uuid not null references public.profiles (id) on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  sku            text not null check (length(trim(sku)) > 0),
  category       text,
  photo_url      text,
  -- Volumen unitario en m³. Alimenta el cálculo de ocupación del envío.
  unit_volume_m3 numeric(8,4) not null default 0.01 check (unit_volume_m3 >= 0),
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (pyme_id, sku)
);

create index products_pyme_idx on public.products (pyme_id) where active;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.inventory (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  warehouse_id   uuid not null references public.warehouses (id) on delete restrict,
  quantity       integer not null default 0 check (quantity >= 0),
  position_label text,
  updated_at     timestamptz not null default now(),
  unique (product_id, warehouse_id)
);

create index inventory_warehouse_idx on public.inventory (warehouse_id);
create index inventory_product_idx   on public.inventory (product_id);

create trigger inventory_touch before update on public.inventory
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Libro mayor del stock. Toda variación de `inventory.quantity` deja acá su
-- razón: es lo que permite auditar una diferencia meses después.
-- -----------------------------------------------------------------------------
create table public.stock_movements (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  warehouse_id   uuid not null references public.warehouses (id) on delete restrict,
  type           public.movement_type not null,
  quantity       integer not null,
  reference_type text,
  reference_id   uuid,
  note           text,
  created_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now()
);

create index stock_movements_product_idx   on public.stock_movements (product_id, created_at desc);
create index stock_movements_warehouse_idx on public.stock_movements (warehouse_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Conteo físico contra stock digital (auditoría periódica del bodeguero).
-- -----------------------------------------------------------------------------
create table public.stock_counts (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  warehouse_id  uuid not null references public.warehouses (id) on delete cascade,
  digital_qty   integer not null,
  physical_qty  integer not null,
  counted_by    uuid references public.profiles (id),
  counted_at    timestamptz not null default now(),
  delta integer generated always as (physical_qty - digital_qty) stored
);

create index stock_counts_product_idx on public.stock_counts (product_id, counted_at desc);
