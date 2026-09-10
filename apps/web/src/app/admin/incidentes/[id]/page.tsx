import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge, type Tone } from '@/components/ui/badge';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { LABELS } from '@bodgo/core';
import { IncidentNotes, IncidentStatus } from './controls';

export const metadata: Metadata = { title: 'Incidente' };

const SEVERIDAD: Record<string, Tone> = { low: 'neutral', medium: 'warning', high: 'danger' };
const ESTADO: Record<string, Tone> = { open: 'danger', in_progress: 'warning', resolved: 'success' };

export default async function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: incident } = await supabase
    .from('incidents')
    .select(
      'id, code, title, severity, status, related_type, related_id, created_at, resolved_at, pyme_id, warehouses(id, comuna, code)',
    )
    .eq('id', id)
    .maybeSingle();

  if (!incident) notFound();

  const [{ data: notes }, { data: pyme }] = await Promise.all([
    supabase
      .from('incident_notes')
      .select('id, body, created_at, author_id')
      .eq('incident_id', id)
      .order('created_at'),
    incident.pyme_id
      ? supabase
          .from('pyme_profiles')
          .select('business_name')
          .eq('profile_id', incident.pyme_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const autores = [...new Set((notes ?? []).map((n) => n.author_id))];
  const { data: perfiles } = autores.length
    ? await supabase.from('public_profiles').select('id, full_name').in('id', autores)
    : { data: [] };
  const nombre = new Map((perfiles ?? []).map((p) => [p.id, p.full_name ?? 'Equipo BodGo']));

  return (
    <div className="space-y-4">
      <StepHeader
        titulo={incident.title}
        subtitulo={<span className="font-mono">{incident.code}</span>}
        volverA="/admin/incidentes"
        tomaLaPantalla={false}
      />

      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={SEVERIDAD[incident.severity] ?? 'neutral'}>
            Severidad {LABELS.incidentSeverity[incident.severity].toLowerCase()}
          </Badge>
          <Badge tone={ESTADO[incident.status] ?? 'neutral'}>
            {LABELS.incidentStatus[incident.status]}
          </Badge>
        </div>

        <dl className="mt-4 space-y-2.5 text-[13px]">
          <Fila label="Abierto" valor={new Date(incident.created_at).toLocaleString('es-CL')} />
          {incident.resolved_at ? (
            <Fila label="Cerrado" valor={new Date(incident.resolved_at).toLocaleString('es-CL')} />
          ) : null}
          {pyme?.business_name ? <Fila label="PyME" valor={pyme.business_name} /> : null}
          {incident.warehouses ? (
            <Fila
              label="Microbodega"
              valor={
                <Link
                  href={`/admin/bodegas`}
                  className="font-bold text-brand-600 hover:underline"
                >
                  {incident.warehouses.comuna} · {incident.warehouses.code}
                </Link>
              }
            />
          ) : null}
          {incident.related_type === 'discrepancy' && incident.related_id ? (
            <Fila
              label="Origen"
              valor={
                <Link
                  href={`/admin/discrepancias/${incident.related_id}`}
                  className="font-bold text-brand-600 hover:underline"
                >
                  Discrepancia escalada
                </Link>
              }
            />
          ) : null}
        </dl>
      </section>

      <IncidentStatus incidentId={incident.id} status={incident.status} />

      <IncidentNotes
        incidentId={incident.id}
        notes={(notes ?? []).map((n) => ({
          id: n.id,
          body: n.body,
          autor: nombre.get(n.author_id) ?? 'Equipo BodGo',
          cuando: new Date(n.created_at).toLocaleString('es-CL'),
        }))}
      />
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-navy-900">{valor}</dd>
    </div>
  );
}
