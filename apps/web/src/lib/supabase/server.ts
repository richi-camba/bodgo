import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@bodgo/db';

/**
 * Cliente para Server Components, Route Handlers y Server Actions.
 * Sigue siendo la clave publicable: la sesión del usuario viaja en cookies y
 * RLS se aplica igual que en el navegador.
 */
export async function createClient() {
  const store = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(list) {
          try {
            for (const { name, value, options } of list) store.set(name, value, options);
          } catch {
            // Un Server Component no puede escribir cookies. El middleware ya
            // refrescó la sesión, así que se puede ignorar sin perder nada.
          }
        },
      },
    },
  );
}

/**
 * Cliente anónimo y sin cookies, para comprobar credenciales.
 *
 * Comprobar una contraseña es entrar de nuevo, y hacerlo con el cliente de
 * la sesión le escribiría cookies encima: reemplazaría los tokens vivos por
 * los de una sesión recién abierta. Este cliente vive y muere dentro de la
 * comprobación, así que la sesión del usuario queda intacta pase lo que pase.
 */
export function createThrowawayClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Cliente administrativo. Salta RLS por completo.
 *
 * Sólo para trabajos del servidor que no tienen un usuario detrás —
 * liquidaciones de fin de mes, webhooks de canales de venta, URLs firmadas para
 * la contraparte de una operación. Nunca se importa desde un componente
 * cliente: la clave secreta no tiene prefijo NEXT_PUBLIC_ y no llega al bundle.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY: es obligatoria para las tareas de servidor.');
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
