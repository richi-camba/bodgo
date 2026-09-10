import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Dashboard' };

const SEVERIDAD: Record<string, Tone> = { low: 'neutral', medium: 'warning', high: 'danger' };
const ESTADO_BODEGA: Record<string, Tone> = {
  draft: 'neutral',
  pending_review: 'warning',
  active: 'success',
  paused: 'neutral',
  rejected: 'danger',
};

export default async function AdminHome() {
  const supabase = await createClient();

  const inicioDeMes = new Date();
  inicioDeMes.setDate(1);
  inicioDeMes.setHours(0, 0, 0, 0);
  const inicioAnterior = new Date(inicioDeMes);
  inicioAnterior.setMonth(inicioAnterior.getMonth() - 1);

  const [
    { data: warehouses },
    { data: contracts },
    { data: orders },
    { data: discrepancies },
    { data: incidents },
    { data: profiles },
    { data: checklist },
    { data: leads },
  ] = await Promise.all([
    supabase
      .from('warehouses')
      .select('id, code, comuna, total_m2, status, bodeguero_id, created_at')
      .order('created_at'),
    supabase.from('contracts').select('id, warehouse_id, m2, base_amount, status'),
    supabase.from('orders').select('id, status, total_amount, created_at'),
    supabase.from('discrepancies').select('id, code, type, status, units_short, created_at'),
    supabase
      .from('incidents')
      .select('id, code, title, severity, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('profiles').select('id, role, full_name, created_at'),
    supabase.from('warehouse_checklist').select('warehouse_id, item, status'),
    supabase
      .from('leads')
      .select('id, name, email, comuna, role_interest, message, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const nombre = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? '—']));
  const activas = (warehouses ?? []).filter((w) => w.status === 'active');
  const enProceso = (warehouses ?? []).filter((w) => w.status === 'pending_review');

  const pymes = (profiles ?? []).filter((p) => p.role === 'pyme');
  const pymesNuevas = pymes.filter((p) => new Date(p.created_at) >= inicioDeMes).length;

  const delMes = (orders ?? []).filter((o) => new Date(o.created_at) >= inicioDeMes);
  const delAnterior = (orders ?? []).filter(
    (o) => new Date(o.created_at) >= inicioAnterior && new Date(o.created_at) < inicioDeMes,
  );
  const gmv = delMes.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const gmvAnterior = delAnterior.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const variacion =
    gmvAnterior > 0 ? Math.round(((gmv - gmvAnterior) / gmvAnterior) * 100) : null;

  const abiertos = (incidents ?? []).filter((i) => i.status !== 'resolved');
  const diferencias = (discrepancies ?? []).filter((d) => d.status !== 'resolved');

  const arrendados = new Map<string, number>();
  for (const c of contracts ?? []) {
    if (c.status !== 'active') continue;
    arrendados.set(c.warehouse_id, (arrendados.get(c.warehouse_id) ?? 0) + Number(c.m2));
  }

  const KPIS = [
    {
      label: 'PyMEs activas',
      value: formatNumber(pymes.length),
      nota: pymesNuevas > 0 ? `+${pymesNuevas} este mes` : 'sin altas este mes',
      tono: pymesNuevas > 0 ? 'bien' : 'neutro',
    },
    {
      label: 'Bodegas habilitadas',
      value: formatNumber(activas.length),
      nota: enProceso.length ? `${enProceso.length} en proceso` : 'ninguna en revisión',
      tono: 'neutro',
    },
    {
      label: 'GMV del mes',
      value: formatCLP(gmv),
      nota:
        variacion == null
          ? 'primer mes con ventas'
          : `${variacion >= 0 ? '▲' : '▼'} ${Math.abs(variacion)}% vs. mes anterior`,
      tono: variacion == null ? 'neutro' : variacion >= 0 ? 'bien' : 'mal',
    },
    {
      label: 'Incidentes abiertos',
      value: formatNumber(abiertos.length),
      nota: abiertos.length ? 'requieren seguimiento' : 'nada pendiente',
      tono: abiertos.length ? 'ojo' : 'bien',
    },
  ] as const;

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" subtitle="Estado operativo de BodGo en tiempo real." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-[16px] border border-line-100 bg-white p-[18px]">
            <p className="text-[12px] font-semibold text-ink-500">{k.label}</p>
            <p className="mt-2 text-[28px] font-extrabold leading-none tracking-tight text-navy-800 tabular-nums">
              {k.value}
            </p>
            <p
              className={`mt-1 text-[12px] font-bold ${
                k.tono === 'bien'
                  ? 'text-success-700'
                  : k.tono === 'mal'
                    ? 'text-danger-700'
                    : k.tono === 'ojo'
                      ? 'text-warning-700'
                      : 'text-ink-500'
              }`}
            >
              {k.nota}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* ------------------------------------------------ red de bodegas */}
        <section className="card overflow-hidden p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-navy-900">Microbodegas de la red</h2>
            <Link href="/admin/bodegas" className="text-[12.5px] font-bold text-brand-600 hover:underline">
              Ver todas
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead>
                <tr className="border-b border-line-100 text-[11px] uppercase tracking-[.04em] text-ink-500">
                  <th scope="col" className="pb-2.5 pr-3 font-bold">Comuna</th>
                  <th scope="col" className="pb-2.5 pr-3 font-bold">Bodeguero</th>
                  <th scope="col" className="pb-2.5 pr-3 text-right font-bold">m²</th>
                  <th scope="col" className="pb-2.5 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(warehouses ?? []).map((w) => {
                  const usados = arrendados.get(w.id) ?? 0;
                  return (
                    <tr key={w.id} className="border-b border-line-100 last:border-0">
                      <td className="py-3 pr-3">
                        <p className="text-[13.5px] font-bold text-navy-900">{w.comuna}</p>
                        <p className="font-mono text-[11px] text-ink-500">{w.code}</p>
                      </td>
                      <td className="py-3 pr-3 text-[13px] text-ink-700">
                        {nombre.get(w.bodeguero_id) ?? '—'}
                      </td>
                      <td className="py-3 pr-3 text-right text-[13px] text-ink-700 tabular-nums">
                        {formatNumber(usados, 1)} / {formatNumber(Number(w.total_m2), 0)}
                      </td>
                      <td className="py-3">
                        <Badge tone={ESTADO_BODEGA[w.status] ?? 'neutral'}>
                          {LABELS.warehouseStatus[w.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* --------------------------------------------------- incidentes */}
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-navy-900">Incidentes recientes</h2>
            <Link href="/admin/incidentes" className="text-[12.5px] font-bold text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>

          {incidents?.length ? (
            <ul className="mt-3 space-y-2.5">
              {incidents.map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/admin/incidentes/${i.id}`}
                    className="block rounded-[12px] bg-surface-25 p-3 transition-colors hover:bg-surface-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-[13px] font-bold text-navy-900">{i.title}</p>
                      <Badge tone={SEVERIDAD[i.severity] ?? 'neutral'}>
                        {LABELS.incidentSeverity[i.severity]}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-ink-500">
                      {i.code} · {LABELS.incidentStatus[i.status]}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[13px] text-ink-500">Sin incidentes registrados.</p>
          )}
        </section>
      </div>

      {/* ----------------------------------------------------- habilitación */}
      {enProceso.map((w) => {
        const items = (checklist ?? []).filter((c) => c.warehouse_id === w.id);
        if (!items.length) return null;
        return (
          <section key={w.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-navy-900">
                Habilitación · {w.comuna}
              </h2>
              <Link href="/admin/bodegas" className="text-[12.5px] font-bold text-brand-600 hover:underline">
                Revisar
              </Link>
            </div>
            <p className="mt-0.5 text-[12px] text-ink-500">Checklist de microbodega</p>

            <ul className="mt-3.5 grid gap-2 sm:grid-cols-2">
              {items.map((c) => {
                const listo = c.status === 'ok';
                return (
                  <li key={c.item} className="flex items-center gap-2.5 text-[13px]">
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        listo ? 'bg-success-600 text-white' : 'border-2 border-line-300'
                      }`}
                    >
                      {listo ? <Icon name="listo" size={12} /> : null}
                    </span>
                    <span className={listo ? 'text-ink-700' : 'text-ink-500'}>{c.item}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {/* --------------------------------------------------- discrepancias */}
      <section className="card">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-[15px] font-bold text-navy-900">Discrepancias abiertas</h2>
          <Link href="/admin/discrepancias" className="text-[12.5px] font-bold text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>

        {diferencias.length ? (
          <ul className="mt-3 divide-y divide-line-100">
            {diferencias.slice(0, 5).map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/discrepancias/${d.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface-25"
                >
                  <div>
                    <p className="text-[13.5px] font-bold text-navy-900">{d.code}</p>
                    <p className="text-[12px] text-ink-500">
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
          <p className="px-5 py-8 text-center text-[13px] text-ink-500">
            Ninguna diferencia abierta. La red está cuadrada.
          </p>
        )}
      </section>

      {/* Los contactos que deja la web pública. Es la única tabla donde
          escribe alguien sin cuenta, y sólo el admin puede leerla. */}
      <section className="card">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-[15px] font-bold text-navy-900">Contactos desde la web</h2>
          {leads?.length ? (
            <span className="text-[12px] font-semibold text-ink-500">últimos {leads.length}</span>
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
                    <p className="text-[12px] text-ink-500">
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
          <p className="px-5 py-8 text-center text-[13px] text-ink-500">
            Nadie ha dejado su contacto todavía.
          </p>
        )}
      </section>
    </div>
  );
}
