import type { Metadata } from 'next';
import { PageHeader, Stat } from '@/components/ui/stat';
import { TicketList, type TicketRow } from '@/components/app/inbox';
import { createClient } from '@/lib/supabase/server';
import { cuando } from '@/lib/inbox';

export const metadata: Metadata = { title: 'Tickets' };

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, code, subject, reason, status, created_at, resolved_at, opened_by')
    .order('created_at', { ascending: false });

  const autores = [...new Set((tickets ?? []).map((t) => t.opened_by))];
  const { data: perfiles } = autores.length
    ? await supabase.from('public_profiles').select('id, full_name').in('id', autores)
    : { data: [] };
  const nombre = new Map((perfiles ?? []).map((p) => [p.id, p.full_name ?? 'Usuario']));

  const abiertos = (tickets ?? []).filter((t) => t.status !== 'resolved');
  const cerrados = (tickets ?? []).filter((t) => t.resolved_at);

  // Cuánto tarda el equipo en cerrar: es lo que la gente siente, no cuántos
  // tickets hay abiertos en un momento dado.
  const horas = cerrados.map(
    (t) => (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()) / 36e5,
  );
  const medio = horas.length ? horas.reduce((a, b) => a + b, 0) / horas.length : null;

  const visibles: TicketRow[] = (tickets ?? [])
    .filter((t) => (estado === 'abiertos' ? t.status !== 'resolved' : true))
    .map((t) => ({
      id: t.id,
      code: t.code,
      subject: t.subject,
      reason: t.reason,
      status: t.status,
      cuando: cuando(t.created_at),
      autor: nombre.get(t.opened_by),
    }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tickets"
        subtitle="Lo que PyMEs y bodegueros le preguntan al equipo BodGo."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          value={abiertos.length}
          label="Sin resolver"
          orden="etiqueta-primero"
          tone={abiertos.length ? 'danger' : 'success'}
        />
        <Stat
          value={abiertos.filter((t) => t.status === 'open').length}
          label="Sin tomar"
          orden="etiqueta-primero"
        />
        <Stat value={cerrados.length} label="Resueltos" orden="etiqueta-primero" />
        <Stat
          value={medio != null ? `${Math.round(medio)} h` : '—'}
          label="Tiempo medio de cierre"
          orden="etiqueta-primero"
        />
      </div>

      <TicketList
        base="/admin/tickets"
        tickets={visibles}
        vacio="Nadie ha escrito al equipo todavía."
      />
    </div>
  );
}
