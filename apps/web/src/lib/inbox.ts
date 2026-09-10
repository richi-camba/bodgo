import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ConvoRow, TicketRow } from '@/components/app/inbox';
import { initialsOf } from '@/lib/comms';

/** Hora si es de hoy, fecha corta si es de antes. Es lo que se lee de un vistazo. */
export function cuando(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const hoy = new Date().toDateString() === d.toDateString();
  return hoy
    ? d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
}

/**
 * Bandeja de conversaciones y tickets del usuario en sesión.
 *
 * Sirve igual a la PyME y al bodeguero: RLS ya recorta las filas a las suyas,
 * así que la única diferencia es de quién es el nombre que se muestra —el de
 * la contraparte, no el propio.
 */
export async function loadInbox(rol: 'pyme' | 'bodeguero') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: convos }, { data: tickets }] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, pyme_id, bodeguero_id, last_message_at, created_at, warehouses(comuna)')
      .order('last_message_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('tickets')
      .select('id, code, subject, reason, status, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const otros = [
    ...new Set((convos ?? []).map((c) => (rol === 'pyme' ? c.bodeguero_id : c.pyme_id))),
  ];

  const [{ data: perfiles }, { data: negocios }, { data: mensajes }] = await Promise.all([
    otros.length
      ? supabase.from('public_profiles').select('id, full_name').in('id', otros)
      : Promise.resolve({ data: [] }),
    rol === 'bodeguero' && otros.length
      ? supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', otros)
      : Promise.resolve({ data: [] }),
    (convos ?? []).length
      ? supabase
          .from('messages')
          .select('conversation_id, body, sender_id, read_at, created_at')
          .in('conversation_id', (convos ?? []).map((c) => c.id))
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const nombre = new Map((perfiles ?? []).map((p) => [p.id, p.full_name ?? 'Contraparte']));
  const negocio = new Map((negocios ?? []).map((n) => [n.profile_id, n.business_name]));

  const filas: ConvoRow[] = (convos ?? []).map((c) => {
    const otro = rol === 'pyme' ? c.bodeguero_id : c.pyme_id;
    // Al bodeguero le sirve el nombre del negocio; a la PyME, el de la persona.
    const titulo = (rol === 'bodeguero' ? negocio.get(otro) : null) ?? nombre.get(otro) ?? 'Contraparte';
    const suyos = (mensajes ?? []).filter((m) => m.conversation_id === c.id);
    const ultimo = suyos[0];

    return {
      id: c.id,
      nombre: titulo,
      iniciales: initialsOf(titulo),
      ultimo: ultimo?.body ?? 'Sin mensajes todavía',
      cuando: cuando(c.last_message_at ?? ultimo?.created_at ?? c.created_at),
      sinLeer: suyos.some((m) => m.sender_id !== user?.id && !m.read_at),
    };
  });

  const abiertos: TicketRow[] = (tickets ?? []).map((t) => ({
    id: t.id,
    code: t.code,
    subject: t.subject,
    reason: t.reason,
    status: t.status,
    cuando: cuando(t.created_at),
  }));

  return { convos: filas, tickets: abiertos };
}

/**
 * Un hilo con su contraparte y sus mensajes.
 *
 * Devuelve `null` si la conversación no existe o no es del usuario: RLS ya la
 * esconde, y la página lo traduce en un 404 en vez de una pantalla en blanco.
 */
export async function loadConversation(id: string, rol: 'pyme' | 'bodeguero') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: convo } = await supabase
    .from('conversations')
    .select('id, pyme_id, bodeguero_id, warehouse_id, warehouses(comuna)')
    .eq('id', id)
    .maybeSingle();

  if (!convo || !user) return null;

  const otro = rol === 'pyme' ? convo.bodeguero_id : convo.pyme_id;

  const [{ data: mensajes }, { data: perfil }, { data: negocio }] = await Promise.all([
    supabase
      .from('messages')
      .select('id, body, sender_id, created_at')
      .eq('conversation_id', id)
      .order('created_at'),
    supabase.from('public_profiles').select('full_name').eq('id', otro).maybeSingle(),
    rol === 'bodeguero'
      ? supabase.from('pyme_profiles').select('business_name').eq('profile_id', otro).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const titulo = negocio?.business_name ?? perfil?.full_name ?? 'Contraparte';

  return {
    id: convo.id,
    titulo,
    iniciales: initialsOf(titulo),
    comuna: convo.warehouses?.comuna ?? null,
    contraparte: rol === 'pyme' ? 'bodeguero' : 'PyME',
    mensajes: (mensajes ?? []).map((m) => ({
      id: m.id,
      body: m.body ?? '',
      mio: m.sender_id === user.id,
      autor: m.sender_id === user.id ? 'Tú' : titulo,
      hora: new Date(m.created_at).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    })),
  };
}
