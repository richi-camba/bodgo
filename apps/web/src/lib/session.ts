import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Enum } from '@bodgo/db';

export type SessionUser = {
  id: string;
  email: string | null;
  role: Enum<'user_role'>;
  fullName: string;
  initials: string;
  verified: boolean;
};

/** Iniciales para el avatar: "Valentina Castro" → "VC". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * Usuario autenticado con su perfil.
 *
 * El middleware ya bloqueó a los no autenticados, pero cada página lo vuelve a
 * comprobar: un Server Component no debería confiar en que alguien más validó.
 */
export async function requireUser(role?: Enum<'user_role'>): Promise<SessionUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/ingresar');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, verified')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/ingresar');
  if (role && profile.role !== role) redirect('/');

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role,
    fullName: profile.full_name,
    initials: initialsOf(profile.full_name),
    verified: profile.verified,
  };
}
