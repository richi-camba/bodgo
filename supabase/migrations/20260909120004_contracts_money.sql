-- =============================================================================
-- BodGo · contratos y plata.
--
-- El modelo es de custodia: a la PyME se le cobra por adelantado, el monto
-- queda retenido en `payments.status = 'held'` y se libera al bodeguero recién
-- cuando confirma la recepción de la mercadería. Si el contrato se corta antes,
-- la parte no usada vuelve a la PyME.
-- =============================================================================

create table public.contracts (
  id            uuid primary key default gen_random_uuid(),
  contract_no   text not null unique default ('STR-' || nextval('public.contract_no_seq')),
  pyme_id       uuid not null references public.profiles (id) on delete restrict,
  warehouse_id  uuid not null references public.warehouses (id) on delete restrict,

  m2            numeric(6,2) not null check (m2 > 0),
  price_per_m2  integer not null check (price_per_m2 > 0),

  -- Congelados al contratar: si el bodeguero sube el precio, este contrato no
  -- cambia. base = m2 × price_per_m2, commission = 8% de base.
  base_amount       integer not null check (base_amount >= 0),
  commission_amount integer not null check (commission_amount >= 0),
  total_amount      integer not null check (total_amount >= 0),

  status        public.contract_status not null default 'pending_payment',
  start_date    date,
  next_charge_date date,
  ended_at      timestamptz,
  termination_days_used integer check (termination_days_used between 0 and 30),
  refund_amount integer,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  capacity_m3 numeric(7,2) generated always as (round(m2 * 1.8, 2)) stored,

  constraint contracts_total_is_base_plus_commission
    check (total_amount = base_amount + commission_amount)
);

create index contracts_pyme_idx      on public.contracts (pyme_id, status);
create index contracts_warehouse_idx on public.contracts (warehouse_id, status);

create trigger contracts_touch before update on public.contracts
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Medios de pago guardados.
--
-- Nunca se guarda el número completo: sólo marca, últimos 4 y el token del
-- procesador. El prototipo declara Transbank; hasta que exista el convenio,
-- `provider = 'demo'` simula el cobro (••••4242 aprueba, ••••0002 rechaza).
-- -----------------------------------------------------------------------------
create table public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  brand       text not null,
  last4       text not null check (last4 ~ '^[0-9]{4}$'),
  exp_month   smallint check (exp_month between 1 and 12),
  exp_year    smallint,
  holder_name text,
  provider    text not null default 'demo',
  provider_token text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index payment_methods_profile_idx on public.payment_methods (profile_id);
create unique index payment_methods_one_default
  on public.payment_methods (profile_id) where is_default;

-- -----------------------------------------------------------------------------
-- Cobros a la PyME. Un pago vive en custodia hasta que se libera o se devuelve.
-- -----------------------------------------------------------------------------
create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid references public.contracts (id) on delete cascade,
  pyme_id       uuid not null references public.profiles (id) on delete restrict,
  payment_method_id uuid references public.payment_methods (id) on delete set null,

  amount        integer not null check (amount > 0),
  status        public.payment_status not null default 'pending',
  provider      text not null default 'demo',
  provider_ref  text,
  attempt       integer not null default 1 check (attempt between 1 and 3),
  failure_reason text,

  held_at       timestamptz,
  released_at   timestamptz,
  refunded_at   timestamptz,
  refund_amount integer check (refund_amount >= 0),
  created_at    timestamptz not null default now()
);

create index payments_contract_idx on public.payments (contract_id);
create index payments_pyme_idx     on public.payments (pyme_id, status);
create index payments_held_idx     on public.payments (status) where status = 'held';

-- -----------------------------------------------------------------------------
-- Liquidaciones al bodeguero, a fin de mes, netas del 15% de BodGo.
-- -----------------------------------------------------------------------------
create table public.payouts (
  id            uuid primary key default gen_random_uuid(),
  bodeguero_id  uuid not null references public.profiles (id) on delete restrict,
  period_start  date not null,
  period_end    date not null,
  gross_amount      integer not null default 0 check (gross_amount >= 0),
  commission_amount integer not null default 0 check (commission_amount >= 0),
  net_amount        integer not null default 0 check (net_amount >= 0),
  status        public.payout_status not null default 'scheduled',
  released_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (bodeguero_id, period_start, period_end),
  constraint payouts_net_is_gross_minus_commission
    check (net_amount = gross_amount - commission_amount)
);

create table public.payout_items (
  id          uuid primary key default gen_random_uuid(),
  payout_id   uuid not null references public.payouts (id) on delete cascade,
  payment_id  uuid references public.payments (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete set null,
  amount      integer not null,
  description text not null,
  created_at  timestamptz not null default now()
);

create index payout_items_payout_idx on public.payout_items (payout_id);
