-- =============================================================================
-- BodGo · repartidores y viajes.
--
-- El último tramo: de la bodega a la puerta del comprador. Un viaje se ofrece
-- a los repartidores en línea con datos a nivel de comuna; sólo al aceptarlo
-- el repartidor ve la dirección exacta de retiro y de entrega. Es la misma
-- regla que rige la dirección de una microbodega.
-- =============================================================================

create type public.delivery_status as enum (
  'offered', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'expired'
);

create type public.vehicle_type as enum ('moto', 'bicicleta', 'auto', 'furgon');

create sequence public.delivery_code_seq start 9140;

-- -----------------------------------------------------------------------------
-- Perfil del repartidor.
-- -----------------------------------------------------------------------------
create table public.courier_profiles (
  profile_id         uuid primary key references public.profiles (id) on delete cascade,
  rut                text,
  email              citext,
  phone              text,
  vehicle            public.vehicle_type not null default 'moto',
  plate              text,
  bank_name          text,
  bank_account_last4 text,
  rating             numeric(2,1) not null default 5.0 check (rating between 0 and 5),
  ratings_count      integer not null default 0,
  trips_count        integer not null default 0,
  documents_ok       boolean not null default false,
  preferred_comunas  text[] not null default '{}',
  -- Estar en línea es lo que habilita a recibir ofertas. Se apaga solo si el
  -- repartidor cierra sesión.
  is_online          boolean not null default false,
  last_online_at     timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index courier_profiles_online_idx on public.courier_profiles (is_online) where is_online;

create trigger courier_profiles_touch before update on public.courier_profiles
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Viajes.
--
-- Los montos se congelan al ofrecer el viaje: si mañana cambia la tabla de
-- tarifas, lo que se le prometió al repartidor no cambia.
-- -----------------------------------------------------------------------------
create table public.deliveries (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default ('VJE-' || nextval('public.delivery_code_seq')),
  order_id      uuid not null references public.orders (id) on delete cascade,
  warehouse_id  uuid not null references public.warehouses (id) on delete restrict,
  courier_id    uuid references public.profiles (id) on delete set null,

  status        public.delivery_status not null default 'offered',
  zone          smallint not null check (zone between 1 and 4),
  distance_km   numeric(5,1) check (distance_km >= 0),
  eta_minutes   integer check (eta_minutes >= 0),

  buyer_fee     integer not null check (buyer_fee >= 0),
  commission_amount integer not null check (commission_amount >= 0),
  courier_fee   integer not null check (courier_fee >= 0),

  pickup_photo_url   text,
  delivery_photo_url text,
  rating        smallint check (rating between 1 and 5),

  offered_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  picked_up_at  timestamptz,
  delivered_at  timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint deliveries_fee_splits
    check (buyer_fee = commission_amount + courier_fee),
  -- Un viaje sin repartidor sólo puede estar ofrecido, vencido o cancelado.
  constraint deliveries_assigned_when_active
    check (courier_id is not null or status in ('offered', 'cancelled', 'expired'))
);

create index deliveries_courier_idx on public.deliveries (courier_id, status);
create index deliveries_order_idx   on public.deliveries (order_id);
create index deliveries_open_idx    on public.deliveries (status) where status = 'offered';

-- Un pedido no puede tener dos viajes vivos a la vez. Un viaje rechazado o
-- vencido sí deja volver a ofrecerlo.
create unique index deliveries_one_active_per_order
  on public.deliveries (order_id)
  where status not in ('cancelled', 'expired');

create trigger deliveries_touch before update on public.deliveries
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- El alta de cuenta ahora acepta repartidores.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'pyme');
  assigned  public.user_role;
begin
  -- 'admin' nunca se puede pedir desde el cliente: se promueve a mano.
  assigned := case requested
                when 'bodeguero'  then 'bodeguero'::public.user_role
                when 'repartidor' then 'repartidor'::public.user_role
                else 'pyme'::public.user_role
              end;

  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    assigned,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  if assigned = 'pyme' then
    insert into public.pyme_profiles (profile_id, business_name, email)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''),
               nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
               split_part(new.email, '@', 1)),
      new.email
    );
  elsif assigned = 'bodeguero' then
    insert into public.bodeguero_profiles (profile_id, email) values (new.id, new.email);
  else
    insert into public.courier_profiles (profile_id, email) values (new.id, new.email);
  end if;

  insert into public.notification_preferences (profile_id) values (new.id);

  return new;
end;
$$;
