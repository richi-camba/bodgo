-- =============================================================================
-- BodGo · helpers de RLS.
--
-- Van después de las tablas porque una función SQL se valida al crearse: si
-- `profiles` todavía no existe, Postgres rechaza la definición.
--
-- Son SECURITY DEFINER a propósito: consultan las mismas tablas sobre las que
-- después se evalúan las políticas, y sin eso Postgres entra en recursión al
-- comprobar la política de `profiles` desde la política de `profiles`.
-- `search_path` fijo para que no puedan ser secuestrados por un esquema del
-- usuario.
-- =============================================================================

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_role_name() returns public.user_role
  language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

/** ¿La bodega pertenece al usuario autenticado? */
create or replace function public.owns_warehouse(warehouse uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.warehouses w
    where w.id = warehouse and w.bodeguero_id = auth.uid()
  );
$$;

/** ¿El usuario es la PyME o el bodeguero de esta bodega? */
create or replace function public.is_warehouse_party(warehouse uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.warehouses w where w.id = warehouse and w.bodeguero_id = auth.uid()
  ) or exists (
    select 1 from public.contracts c
    where c.warehouse_id = warehouse
      and c.pyme_id = auth.uid()
      and c.status in ('pending_payment', 'active')
  );
$$;

comment on function public.is_admin is 'RLS: el usuario tiene rol admin. SECURITY DEFINER para evitar recursión sobre profiles.';
