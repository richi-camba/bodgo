'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@bodgo/db';

/**
 * Cliente para componentes de navegador. Usa la clave publicable, así que todo
 * lo que devuelve pasa por RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
