'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { TICKET_REASONS } from '@/lib/comms';

export type CommsState = { error?: string; ok?: string } | null;

const REASONS = TICKET_REASONS.map((r) => r.key) as [string, ...string[]];

/** Dónde vive la bandeja de cada rol. */
const INBOX: Record<string, string> = {
  pyme: '/app/mensajes',
  bodeguero: '/bodeguero/mensajes',
  admin: '/admin/tickets',
};

async function currentRole(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role ?? 'pyme';
}

// -----------------------------------------------------------------------------
// Conversaciones
// -----------------------------------------------------------------------------

/**
 * Abre —o recupera— la conversación entre una PyME y un bodeguero.
 *
 * Hay un índice único por par y bodega, así que dos pestañas escribiendo a la
 * vez no terminan con dos hilos: el segundo `insert` choca y se recupera el
 * que ya existe.
 */
export async function openConversation(_prev: CommsState, formData: FormData): Promise<CommsState> {
  const parsed = z
    .object({ warehouseId: z.string().uuid(), bodegueroId: z.string().uuid() })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'No se pudo abrir la conversación.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const filtro = {
    pyme_id: user.id,
    bodeguero_id: parsed.data.bodegueroId,
    warehouse_id: parsed.data.warehouseId,
  };

  const { data: existente } = await supabase
    .from('conversations')
    .select('id')
    .match(filtro)
    .maybeSingle();

  let id = existente?.id;

  if (!id) {
    const { data: creada, error } = await supabase
      .from('conversations')
      .insert(filtro)
      .select('id')
      .single();

    if (error) {
      const { data: reintento } = await supabase
        .from('conversations')
        .select('id')
        .match(filtro)
        .maybeSingle();
      if (!reintento) return { error: 'No se pudo abrir la conversación.' };
      id = reintento.id;
    } else {
      id = creada.id;
    }
  }

  redirect(`/app/mensajes/${id}`);
}

/** Manda un mensaje de texto al hilo. */
export async function sendMessage(_prev: CommsState, formData: FormData): Promise<CommsState> {
  const parsed = z
    .object({
      conversationId: z.string().uuid(),
      body: z.string().trim().min(1, 'Escribe algo antes de enviar.').max(2000),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa el mensaje.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase.from('messages').insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: 'No se pudo enviar el mensaje.' };

  revalidatePath('/app/mensajes', 'layout');
  revalidatePath('/bodeguero/mensajes', 'layout');
  return { ok: 'enviado' };
}

/**
 * Marca como leídos los mensajes que me escribieron en este hilo.
 *
 * Sólo los de la contraparte: marcar los propios no significa nada y falsearía
 * el punto azul de la bandeja del otro.
 */
export async function markConversationRead(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null);
}

// -----------------------------------------------------------------------------
// Tickets de soporte
// -----------------------------------------------------------------------------

/** Abre un ticket. Queda visible para quien lo abrió y para el equipo BodGo. */
export async function createTicket(_prev: CommsState, formData: FormData): Promise<CommsState> {
  const parsed = z
    .object({
      subject: z.string().trim().min(5, 'Resume el problema en una línea.').max(160),
      reason: z.enum(REASONS),
      body: z.string().trim().min(10, 'Cuenta qué pasó, con algo de detalle.').max(4000),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({ opened_by: user.id, subject: parsed.data.subject, reason: parsed.data.reason })
    .select('id')
    .single();

  if (error || !ticket) return { error: 'No se pudo abrir el ticket.' };

  // El primer mensaje es la descripción: un ticket sin contexto obliga al
  // equipo a preguntar de nuevo lo que la persona ya escribió.
  const { error: notaError } = await supabase
    .from('ticket_notes')
    .insert({ ticket_id: ticket.id, author_id: user.id, body: parsed.data.body });

  if (notaError) {
    await supabase.from('tickets').delete().eq('id', ticket.id);
    return { error: 'No se pudo abrir el ticket.' };
  }

  const role = await currentRole(supabase, user.id);
  revalidatePath(INBOX[role] ?? '/app/mensajes', 'layout');
  redirect(`${role === 'bodeguero' ? '/bodeguero' : '/app'}/tickets/${ticket.id}`);
}

/** Responde en el hilo del ticket. Lo hace quien lo abrió o el equipo. */
export async function addTicketNote(_prev: CommsState, formData: FormData): Promise<CommsState> {
  const parsed = z
    .object({
      ticketId: z.string().uuid(),
      body: z.string().trim().min(1, 'Escribe algo antes de enviar.').max(4000),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisa el mensaje.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase.from('ticket_notes').insert({
    ticket_id: parsed.data.ticketId,
    author_id: user.id,
    body: parsed.data.body,
  });

  if (error) return { error: 'No se pudo enviar la respuesta.' };

  revalidatePath(`/app/tickets/${parsed.data.ticketId}`);
  revalidatePath(`/bodeguero/tickets/${parsed.data.ticketId}`);
  revalidatePath(`/admin/tickets/${parsed.data.ticketId}`);
  return { ok: 'enviado' };
}

/**
 * Mueve el estado del ticket.
 *
 * Sólo el equipo BodGo: la política de RLS deja el `update` al admin. Quien
 * abrió el ticket puede seguir respondiendo, pero no darse por atendido solo.
 */
export async function setTicketStatus(_prev: CommsState, formData: FormData): Promise<CommsState> {
  const parsed = z
    .object({
      ticketId: z.string().uuid(),
      status: z.enum(['open', 'in_progress', 'resolved']),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: 'Estado no válido.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('tickets')
    .update({
      status: parsed.data.status,
      resolved_at: parsed.data.status === 'resolved' ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.ticketId);

  if (error) return { error: 'No se pudo cambiar el estado.' };

  revalidatePath('/admin/tickets', 'layout');
  return { ok: 'Estado actualizado.' };
}
