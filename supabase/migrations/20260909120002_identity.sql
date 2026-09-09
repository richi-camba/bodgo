-- =============================================================================
-- BodGo · identidad: perfiles y datos por rol.
--
-- `profiles` guarda sólo lo que un tercero puede ver (nombre, rol, avatar).
-- El contacto y los datos tributarios viven en las tablas por rol, que tienen
-- políticas mucho más estrictas. Así la vista pública de perfiles no filtra
-- teléfonos ni RUT.
-- =============================================================================

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null check (length(trim(full_name)) > 0),
  avatar_url  text,
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Datos de la PyME arrendataria.
create table public.pyme_profiles (
  profile_id     uuid primary key references public.profiles (id) on delete cascade,
  business_name  text not null,
  legal_name     text,
  rut            text,
  giro           text,
  email          citext,
  phone          text,
  comuna         text,
  address        text,
  sales_channels public.sales_channel[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger pyme_profiles_touch before update on public.pyme_profiles
  for each row execute function public.touch_updated_at();

-- Datos del bodeguero anfitrión.
create table public.bodeguero_profiles (
  profile_id          uuid primary key references public.profiles (id) on delete cascade,
  rut                 text,
  email               citext,
  phone               text,
  bank_name           text,
  bank_account_last4  text,
  rating              numeric(2,1) not null default 5.0 check (rating between 0 and 5),
  ratings_count       integer not null default 0,
  host_since          date not null default current_date,
  preferred_comunas   text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger bodeguero_profiles_touch before update on public.bodeguero_profiles
  for each row execute function public.touch_updated_at();

-- Preferencias de notificación. Los avisos de pago y de recepción se mandan
-- siempre por correo, apague lo que apague el usuario (ver notify()).
create table public.notification_preferences (
  profile_id  uuid primary key references public.profiles (id) on delete cascade,
  push        boolean not null default true,
  email       boolean not null default true,
  topics      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create trigger notification_preferences_touch before update on public.notification_preferences
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Alta automática de perfil al registrarse.
--
-- El rol y el nombre vienen en el metadata que manda el cliente al hacer
-- signUp. Si falta el rol asumimos 'pyme', que es el registro por defecto de la
-- web pública. `admin` nunca se puede auto-asignar desde el cliente: se
-- promueve a mano en la base.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'pyme');
  assigned  public.user_role;
begin
  assigned := case when requested = 'bodeguero' then 'bodeguero'::public.user_role
                   else 'pyme'::public.user_role end;

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
  else
    insert into public.bodeguero_profiles (profile_id, email)
    values (new.id, new.email);
  end if;

  insert into public.notification_preferences (profile_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
