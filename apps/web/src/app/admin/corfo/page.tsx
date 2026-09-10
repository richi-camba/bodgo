import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber } from '@bodgo/core';
import { ExportButton, type Fila } from '@/components/app/export-button';

export const metadata: Metadata = { title: 'Indicadores Corfo' };

/**
 * Metas comprometidas del piloto en la Región Metropolitana.
 *
 * Son las del proyecto Semilla Inicia 25INI2-312540. Se dejan acá y no en la
 * base porque no cambian durante la ejecución: si cambian, cambia el convenio.
 */
const TARGETS = [
  { key: 'warehouses', label: 'Microbodegas habilitadas', target: 20, unit: '' },
  { key: 'pymes', label: 'PyMEs con contrato vigente', target: 15, unit: '' },
  { key: 'hosts', label: 'Bodegueros activos en la red', target: 12, unit: '' },
  { key: 'orders', label: 'Despachos procesados', target: 500, unit: '' },
  { key: 'comunas', label: 'Comunas cubiertas', target: 8, unit: '' },
  { key: 'matchRate', label: 'Tasa de coincidencia en recepción', target: 95, unit: '%' },
] as const;

export default async function CorfoPage() {
  const supabase = await createClient();

  const [
    { data: warehouses },
    { data: contracts },
    { data: orders },
    { data: shipments },
    { data: discrepancies },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('warehouses').select('id, comuna, status, bodeguero_id'),
    supabase.from('contracts').select('pyme_id, status, total_amount'),
    supabase.from('orders').select('id, status, total_amount'),
    supabase.from('shipments').select('id, status'),
    supabase.from('discrepancies').select('id'),
    supabase.from('profiles').select('id, role'),
  ]);

  const activeWarehouses = (warehouses ?? []).filter((w) => w.status === 'active');
  const activeContracts = (contracts ?? []).filter((c) => c.status === 'active');
  const closedReceptions = (shipments ?? []).filter(
    (s) => s.status === 'received' || s.status === 'discrepancy',
  ).length;

  const actual: Record<string, number> = {
    warehouses: activeWarehouses.length,
    pymes: new Set(activeContracts.map((c) => c.pyme_id)).size,
    hosts: new Set(activeWarehouses.map((w) => w.bodeguero_id)).size,
    orders: (orders ?? []).filter((o) => o.status === 'delivered').length,
    comunas: new Set(activeWarehouses.map((w) => w.comuna)).size,
    matchRate: closedReceptions
      ? Math.round(((closedReceptions - (discrepancies?.length ?? 0)) / closedReceptions) * 100)
      : 100,
  };

  const gmv = (orders ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const recurring = activeContracts.reduce((s, c) => s + c.total_amount, 0);

  // El reporte que se le manda a Corfo: una fila por indicador, con la meta
  // y el avance. Sale de la misma cuenta que está en pantalla.
  const filas: Fila[] = [
    ...TARGETS.map((t) => ({
      Indicador: t.label,
      Valor: `${actual[t.key] ?? 0}${t.unit}`,
      Meta: `${t.target}${t.unit}`,
      'Avance %': Math.min(100, Math.round(((actual[t.key] ?? 0) / t.target) * 100)),
    })),
    { Indicador: 'GMV acumulado', Valor: gmv, Meta: '', 'Avance %': '' },
    { Indicador: 'Ingreso recurrente mensual', Valor: recurring, Meta: '', 'Avance %': '' },
    { Indicador: 'Cuentas creadas', Valor: (profiles ?? []).length, Meta: '', 'Avance %': '' },
    { Indicador: 'Recepciones verificadas', Valor: closedReceptions, Meta: '', 'Avance %': '' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Semilla Inicia · 25INI2-312540"
        subtitle="Indicadores de validación técnica y comercial · Piloto Región Metropolitana"
      />

      <section className="rounded-card bg-navy-800 p-6 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-400">
          Tracción a la fecha
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Headline value={formatCLP(gmv)} label="GMV acumulado" />
          <Headline value={formatCLP(recurring)} label="Ingreso recurrente mensual" />
          <Headline value={String((profiles ?? []).length)} label="Cuentas creadas" />
          <Headline value={String(closedReceptions)} label="Recepciones verificadas" />
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Indicadores comprometidos</h2>
        <p className="mt-1 text-[12.5px] text-ink-500">
          Avance sobre las metas del convenio. Los datos salen de la operación real, no de una
          planilla aparte.
        </p>

        <ul className="mt-6 space-y-5">
          {TARGETS.map((t) => {
            const value = actual[t.key] ?? 0;
            const pct = Math.min(100, Math.round((value / t.target) * 100));
            const met = value >= t.target;

            return (
              <li key={t.key}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[13.5px] font-bold text-navy-900">{t.label}</span>
                  <span className="text-[13px] text-ink-500 tabular-nums">
                    <strong className="text-[15px] font-extrabold text-navy-900">
                      {formatNumber(value)}
                      {t.unit}
                    </strong>{' '}
                    / {t.target}
                    {t.unit} · {pct}% de la meta
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-line-100">
                  <div
                    className={`h-full rounded-pill ${met ? 'bg-success-600' : 'bg-brand-600'}`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                    role="img"
                    aria-label={`${t.label}: ${pct} por ciento de la meta`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <ExportButton
        filas={filas}
        nombre="bodgo-corfo-25INI2-312540"
        unidad="indicador"
        unidadPlural="indicadores"
      />

      <p className="text-center text-[12px] leading-relaxed text-ink-500">
        Iniciativa financiada por Corfo a través del instrumento Semilla Inicia (25INI2-312540), con
        el patrocinio de Innovo. Tamayaz SpA.
      </p>
    </div>
  );
}

function Headline({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[22px] font-extrabold leading-none tabular-nums">{value}</span>
        <span className="mt-1.5 block text-[12px] text-white/70">{label}</span>
      </dd>
    </div>
  );
}
