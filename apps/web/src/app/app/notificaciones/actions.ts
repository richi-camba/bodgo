'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type AvisoState = { error?: string } | null;

/**
 * Marca como leídos los avisos del usuario.
 *
 * No hace falta pasar ids: la política de `notifications` sólo deja tocar los
 * propios, así que el `update` sin filtro de usuario ya viene acotado.
 */
export async function marcarAvisosLeidos(): Promise<AvisoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró.' };

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (error) return { error: 'No se pudieron marcar los avisos.' };

  revalidatePath('/app', 'layout');
  revalidatePath('/bodeguero', 'layout');
  return null;
}
