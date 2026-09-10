import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Resumen de la red' };

const SEVERITY_TONE = { low: 'neutral', medium: 'warning', high: 'danger' } as const;

export default async function AdminHome() {
  const supabase = await createClient();

  const [
    { data: warehouses },
    { data: contracts },
    { data: orders },
    { data: discrepancies },
    { data: incidents },
    { data: profiles },
    { data: leads },
  ] = await Promise.all([
    supabase.from('warehouses').select('id, comuna, total_m2, status'),
    supabase.from('contracts').select('id, m2, base_amount, total_amount, status'),
    supabase.from('orders').select('id, status, total_amount, created_at'),
    supabase.from('discrepancies').select('id, code, type, status, units_short, created_at'),
    supabase.from('incidents').select('id, code, title, severity, status').eq('status', 'open'),
    supabase.from('profiles').select('id, role'),
    supabase
      .from('leads')
      .select('id, name, email, comuna, role_interest, message, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const active = (warehouses ?? []).filter((w) => w.status === 'active');
  const totalM2 = active.reduce((s, w) => s + Number(w.total_m2), 0);
  const takenM2 = (contracts ?? [])
    .filter((c) => c.status === 'active')
    .reduce((s, c) => s + Number(c.m2), 0);
  const occupancy = totalM2 > 0 ? Math.round((takenM2 / totalM2) * 100) : 0;

  const gmv = (orders ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const openDiscrepancies = (discrepancies ?? []).filter((d) => d.status !== 'resolved');
  const pymes = (profiles ?? []).filter((p) => p.role === 'pyme').length;
  const hosts = (profiles ?? []).filter((p) => p.role === 'bodeguero').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Resumen de la red" subtitle="Estado operativo de BodGo en tiempo real." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={active.length} label="Microbodegas activas" />
        <Stat value={`${occupancy}%`} label="Ocupación de la red" />
        <Stat value={formatCLP(gmv)} label="GMV acumulado" />
        <Stat
          value={openDiscrepancies.length}
          label="Discrepancias abiertas"
          tone={openDiscrepancies.length > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={pymes} label={pymes === 1 ? 'PyME registrada' : 'PyMEs registradas'} />
        <Stat value={hosts} label="Bodegueros" />
        <Stat value={formatNumber(totalM2, 1)} label="m² publicados" />
        <Stat value={orders?.length ?? 0} label="Pedidos totales" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-[15px] font-extrabold text-navy-900">Discrepancias recientes</h2>
            <Link href="/admin/discrepancias" className="text-[12.5px] font-bold text-brand-600 hover:underline">
              Ver todas
            </Link>
          </div>

          {openDiscrepancies.length ? (
            <ul className="mt-3 divide-y divide-line-100">
              {openDiscrepancies.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link href={`/admin/discrepancias/${d.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-25">
                    <div>
                      <p className="text-[13.5px] font-bold text-navy-900">{d.code}</p>
                      <p className="text-[12px] text-ink-400">
                        {LABELS.discrepancyType[d.type]}
                        {d.units_short > 0 ? ` · faltan ${d.units_short} u` : ''}
                      </p>
                    </div>
                    <Badge tone="danger">{LABELS.discrepancyStatus[d.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-[13.5px] text-ink-400">
              Ninguna diferencia abierta. La red está cuadrada.
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="px-5 pt-5 text-[15px] font-extrabold text-navy-900">Incidentes abiertos</h2>

          {incidents?.length ? (
            <ul className="mt-3 divide-y divide-line-100">
              {incidents.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-navy-900">{i.title}</p>
                    <p className="text-[12px] text-ink-400">{i.code}</p>
                  </div>
                  <Badge tone={SEVERITY_TONE[i.severity]}>
                    {i.severity === 'high' ? 'Alta' : i.severity === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-[13.5px] text-ink-400">Sin incidentes abiertos.</p>
          )}
        </section>
      </div>

      {/* Los contactos que deja la web pública. Es la única tabla donde
          escribe alguien sin cuenta, y sólo el admin puede leerla. */}
      <section className="card">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">Contactos desde la web</h2>
          {leads?.length ? (
            <span className="text-[12px] font-semibold text-ink-400">últimos {leads.length}</span>
          ) : null}
        </div>

        {leads?.length ? (
          <ul className="mt-3 divide-y divide-line-100">
            {leads.map((lead) => (
              <li key={lead.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-navy-900">
                      {lead.name ?? 'Sin nombre'}
                      <a
                        href={`mailto:${lead.email}`}
                        className="ml-2 font-semibold text-brand-600 hover:underline"
                      >
                        {lead.email}
                      </a>
                    </p>
                    <p className="text-[12px] text-ink-400">
                      {lead.comuna ?? 'Sin comuna'} ·{' '}
                      {new Date(lead.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <Badge tone={lead.role_interest === 'bodeguero' ? 'brand' : 'neutral'}>
                    {lead.role_interest === 'bodeguero' ? 'Quiere arrendar espacio' : 'Busca bodega'}
                  </Badge>
                </div>
                {lead.message ? (
                  <p className="mt-2 rounded-field bg-surface-50 p-2.5 text-[12.5px] leading-relaxed text-ink-700">
                    {lead.message}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-[13.5px] text-ink-400">
            Nadie ha dejado su contacto todavía.
          </p>
        )}
      </section>
    </div>
  );
}
