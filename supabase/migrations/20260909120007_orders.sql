-- =============================================================================
-- BodGo · pedidos de salida (venta de la PyME → comprador final).
--
-- El pedido puede entrar solo desde un canal de venta (Mercado Libre, Shopify)
-- o crearse a mano. Cada cambio de estado deja un evento con foto: es la
-- trazabilidad que respalda un reclamo.
-- =============================================================================

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default ('DSP-' || nextval('public.order_code_seq')),
  pyme_id       uuid not null references public.profiles (id) on delete cascade,
  warehouse_id  uuid not null references public.warehouses (id) on delete restrict,

  channel       public.sales_channel not null default 'manual',
  external_ref  text,

  buyer_name    text not null,
  buyer_phone   text,
  buyer_address text not null,
  buyer_comuna  text not null,
  delivery_notes text,

  items_total   integer not null default 0 check (items_total >= 0),
  shipping_zone text,
  shipping_cost integer not null default 0 check (shipping_cost >= 0),

  delivery_method public.delivery_method,
  courier_name    text,
  tracking_number text,
  tracking_url    text,
  courier_receipt_url text,

  status        public.order_status not null default 'pending',
  packing_photo_url  text,
  delivery_photo_url text,
  rating        smallint check (rating between 1 and 5),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  delivered_at  timestamptz,

  total_amount integer generated always as (items_total + shipping_cost) stored
);

create index orders_pyme_idx      on public.orders (pyme_id, status);
create index orders_warehouse_idx on public.orders (warehouse_id, status);
create index orders_created_idx   on public.orders (created_at desc);
create unique index orders_external_ref_idx
  on public.orders (pyme_id, channel, external_ref) where external_ref is not null;

create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete restrict,
  sku         text not null,
  name        text not null,
  quantity    integer not null check (quantity > 0),
  unit_price  integer not null default 0 check (unit_price >= 0),
  picked      boolean not null default false,
  unique (order_id, product_id)
);

create index order_items_order_idx on public.order_items (order_id);

-- Bitácora de trazabilidad. Una fila por transición, con quién y con qué foto.
create table public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     public.order_status not null,
  note       text,
  photo_url  text,
  actor_id   uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);
