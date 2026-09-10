import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Incidentes' };

const SEVERIDAD: Record<string, Tone> = { low: 'neutral', medium: 'warning', high: 'danger' };
const ESTADO: Record<string, Tone> = { open: 'danger', in_progress: 'warning', resolved: 'success' };

export default async function IncidentsPage() {
  const supabase = await createClient();

  const { data: incidents } = await supabase
    .from('incidents')
    .select('id, code, title, severity, status, created_at, resolved_at, warehouses(comuna)')
    .order('created_at', { ascending: false });

  const abiertos = (incidents ?? []).filter((i) => i.status !== 'resolved');
  const altos = abiertos.filter((i) => i.severity === 'high');

  // Cuánto tardó en cerrarse lo que sí se cerró: es la cifra que mide al
  // equipo, no la cantidad de incidentes abiertos.
  const cerrados = (incidents ?? []).filter((i) => i.resolved_at);
  const horas = cerrados.map(
    (i) => (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()) / 36e5,
  );
  const medio = horas.length ? horas.reduce((a, b) => a + b, 0) / horas.length : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Incidentes"
        subtitle="Lo que la red no resolvió sola y necesita a alguien del equipo."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={abiertos.length} label="Abiertos" orden="etiqueta-primero" tone={abiertos.length ? 'danger' : 'success'} />
        <Stat value={altos.length} label="Severidad alta" orden="etiqueta-primero" />
        <Stat value={cerrados.length} label="Cerrados" orden="etiqueta-primero" />
        <Stat
          value={medio != null ? `${Math.round(medio)} h` : '—'}
          label="Tiempo medio de cierre"
          orden="etiqueta-primero"
        />
      </div>

      {!incidents?.length ? (
        <EmptyState
          icon="discrepancias"
          title="Sin incidentes"
          body="Acá caen los casos que la operación no resolvió sola: robos, daños, discrepancias escaladas y fallas de habilitación."
        />
      ) : (
        <ul className="space-y-2.5">
          {incidents.map((i) => (
            <li key={i.id}>
              <Link
                href={`/admin/incidentes/${i.id}`}
                className="flex items-center gap-3 rounded-[14px] border border-line-100 bg-white p-4 transition-colors hover:border-navy-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-bold text-ink-500">{i.code}</span>
                    <Badge tone={SEVERIDAD[i.severity] ?? 'neutral'}>
                      {LABELS.incidentSeverity[i.severity]}
                    </Badge>
                    <Badge tone={ESTADO[i.status] ?? 'neutral'}>
                      {LABELS.incidentStatus[i.status]}
                    </Badge>
                  </div>
                  <p className="mt-1.5 truncate text-[14px] font-bold text-navy-900">{i.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-500">
                    {i.warehouses?.comuna ? `${i.warehouses.comuna} · ` : ''}
                    {new Date(i.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <span aria-hidden className="shrink-0 text-line-300">
                  <Icon name="siguiente" size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
