'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type LeadState = { error?: string; ok?: string } | null;

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  email: z.string().trim().toLowerCase().email('Revisa el correo, no parece válido.'),
  comuna: z.string().trim().max(80).optional(),
  roleInterest: z.enum(['pyme', 'bodeguero']),
  message: z.string().trim().max(1000).optional(),
  /** Campo señuelo: un humano no lo ve, un bot lo llena. */
  website: z.string().max(0).optional(),
});

/**
 * Deja el contacto de alguien que todavía no tiene cuenta.
 *
 * Es la única escritura de un visitante anónimo en toda la base, y la política
 * de `leads` lo permite a propósito. Sólo el admin puede leerlos.
 */
export async function captureLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };
  }

  // El señuelo venía lleno: es un bot. Se le responde como si todo hubiera
  // salido bien para no darle información sobre por qué falló.
  if (parsed.data.website) {
    return { ok: '¡Gracias! Te escribimos pronto.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('leads').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    comuna: parsed.data.comuna || null,
    role_interest: parsed.data.roleInterest,
    message: parsed.data.message || null,
    source: 'web',
  });

  if (error) {
    return { error: 'No pudimos guardar tu contacto. Inténtalo de nuevo o escríbenos a hola@bodgo.cl.' };
  }

  return { ok: '¡Gracias! Te escribimos dentro de las próximas 24 horas hábiles.' };
}
