import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { TicketNote } from '@/components/app/ticket-thread';

/**
 * Un ticket con su hilo.
 *
 * Marca qué respuestas son del equipo BodGo mirando el rol del autor: para
 * quien abrió el ticket, saber si contesta la plataforma o si está hablando
 * solo es la mitad de la información.
 */
export async function loadTicket(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, code, subject, reason, status, created_at, resolved_at, opened_by')
    .eq('id', id)
    .maybeSingle();

  if (!ticket || !user) return null;

  const { data: notes } = await supabase
    .from('ticket_notes')
    .select('id, body, author_id, created_at')
    .eq('ticket_id', id)
    .order('created_at');

  const autores = [...new Set([...(notes ?? []).map((n) => n.author_id), ticket.opened_by])];
  const { data: perfiles } = autores.length
    ? await supabase.from('public_profiles').select('id, full_name, role').in('id', autores)
    : { data: [] };

  const porId = new Map((perfiles ?? []).map((p) => [p.id, p]));

  const hilo: TicketNote[] = (notes ?? []).map((n) => {
    const autor = porId.get(n.author_id);
    return {
      id: n.id,
      body: n.body,
      autor: autor?.full_name ?? 'Usuario',
      mio: n.author_id === user.id,
      equipo: autor?.role === 'admin',
      cuando: new Date(n.created_at).toLocaleString('es-CL'),
    };
  });

  return {
    ...ticket,
    abiertoPor: porId.get(ticket.opened_by)?.full_name ?? 'Usuario',
    notes: hilo,
  };
}
