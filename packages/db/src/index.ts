export type { Database, Json } from './database.types';
export * from './types';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** Cliente Supabase ya tipado contra el esquema de BodGo. */
export type BodgoClient = SupabaseClient<Database>;

/**
 * Variables de entorno del cliente. Se leen una vez y se validan acá para que
 * un despliegue mal configurado falle al arrancar y no en la primera consulta.
 */
export function readPublicEnv(env: Record<string, string | undefined>) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a apps/web/.env.local.',
    );
  }

  return { url, key };
}
