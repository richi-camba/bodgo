import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@bodgo/db';

/** Rutas que exigen sesión, con el rol que puede entrar a cada una. */
const GUARDED: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/app', roles: ['pyme'] },
  { prefix: '/bodeguero', roles: ['bodeguero'] },
  { prefix: '/repartidor', roles: ['repartidor'] },
  { prefix: '/admin', roles: ['admin'] },
];

/** A dónde va cada rol después de entrar. */
export const HOME_BY_ROLE: Record<string, string> = {
  pyme: '/app',
  bodeguero: '/bodeguero',
  repartidor: '/repartidor',
  admin: '/admin',
};

/**
 * Refresca la sesión en cada request y bloquea el acceso cruzado entre roles.
 *
 * Esto es conveniencia de navegación, no seguridad: quien manda es RLS en la
 * base. Un bodeguero que fuerce la URL de /app no vería datos de nadie igual.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const guard = GUARDED.find((g) => path === g.prefix || path.startsWith(`${g.prefix}/`));

  if (!guard) return response;

  if (!user) {
    const login = request.nextUrl.clone();
    login.pathname = '/ingresar';
    login.searchParams.set('next', path);
    return NextResponse.redirect(login);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  if (!role || !guard.roles.includes(role)) {
    const home = request.nextUrl.clone();
    home.pathname = role ? (HOME_BY_ROLE[role] ?? '/') : '/';
    return NextResponse.redirect(home);
  }

  return response;
}
