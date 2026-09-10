import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { checkCapacityM3, formatNumber, LABELS, usableCapacityM3 } from '@bodgo/core';
import { DispatchButton } from './dispatch-button';

export const metadata: Metadata = { title: 'Envío' };

const STEPS = [
  { key: 'ready', label: 'Envío preparado' },
  { key: 'in_transit', label: 'En camino a la bodega' },
  { key: 'received', label: 'Recibido por el bodeguero' },
] as const;

export default async function ShipmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: shipment } = await supabase
    .from('shipments')
    .select(
      'id, code, description, packages_count, weight_kg, method, status, declared_volume_m3, received_volume_m3, capacity_m3, host_note, dispatched_at, received_at, warehouse_id, contracts(m2), warehouses(comuna, address, bodeguero_id)',
    )
    .eq('id', id)
    .maybeSingle();

  if (!shipment) notFound();

  const [{ data: items }, { data: discrepancy }, { data: host }] = await Promise.all([
    supabase.from('shipment_items').select('*').eq('shipment_id', id).order('name'),
    supabase.from('discrepancies').select('*').eq('shipment_id', id).maybeSingle(),
    supabase
      .from('public_profiles')
      .select('full_name')
      .eq('id', shipment.warehouses?.bodeguero_id ?? '')
      .maybeSingle(),
  ]);

  const capacity = checkCapacityM3(
    Number(shipment.declared_volume_m3 ?? 0),
    Number(shipment.capacity_m3 ?? 0) || usableCapacityM3(Number(shipment.contracts?.m2 ?? 0)),
  );
  const unitTotal = (items ?? []).reduce((s, i) => s + i.declared_qty, 0);

  const reachedIndex =
    shipment.status === 'received' || shipment.status === 'discrepancy'
      ? 2
      : shipment.status === 'in_transit'
        ? 1
        : 0;

  return (
    <div className="space-y-5">
      <Link href="/app/despachos" className="inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a mis envíos
      </Link>

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">{shipment.code}</h1>
            <p className="mt-1 text-[13.5px] text-ink-500">
              {shipment.description} · {shipment.warehouses?.comuna}
            </p>
          </div>
          <Badge tone={shipment.status === 'discrepancy' ? 'danger' : shipment.status === 'received' ? 'success' : 'brand'}>
            {LABELS.shipmentStatus[shipment.status]}
          </Badge>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Bultos" value={String(shipment.packages_count)} />
          <Metric label="Peso" value={shipment.weight_kg ? `${formatNumber(Number(shipment.weight_kg), 1)} kg` : '—'} />
          <Metric label="Volumen" value={`${formatNumber(Number(shipment.declared_volume_m3 ?? 0), 2)} m³`} />
          <Metric label="Unidades" value={formatNumber(unitTotal)} />
        </dl>

        {capacity.exceeds ? (
          <p className="mt-4 rounded-field bg-danger-50 p-3.5 text-[12.5px] leading-relaxed text-danger-700">
            Este envío excede en {formatNumber(capacity.excessM3, 2)} m³ la capacidad contratada
            ({formatNumber(capacity.capacityM3, 1)} m³). El bodeguero puede rechazar el excedente.
          </p>
        ) : null}
      </header>

      {/* -------------------------------------------------------- seguimiento */}
      <section className="card p-6">
        <h2 className="text-[15px] font-extrabold text-navy-900">Seguimiento</h2>

        <ol className="mt-5 space-y-0">
          {STEPS.map((step, i) => {
            const done = i <= reachedIndex && shipment.status !== 'draft';
            const isLast = i === STEPS.length - 1;
            return (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                      done ? 'bg-success-600 text-white' : 'bg-line-100 text-ink-400'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  {!isLast ? (
                    <span className={`my-1 w-0.5 flex-1 ${done ? 'bg-success-600' : 'bg-line-200'}`} />
                  ) : null}
                </div>
                <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                  <p className={`text-[13.5px] font-bold ${done ? 'text-navy-900' : 'text-ink-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-[12px] text-ink-400">
                    {step.key === 'ready' && shipment.packages_count
                      ? `${shipment.packages_count} bultos etiquetados`
                      : null}
                    {step.key === 'in_transit' && shipment.dispatched_at
                      ? new Date(shipment.dispatched_at).toLocaleString('es-CL')
                      : null}
                    {step.key === 'received' && shipment.received_at
                      ? `${host?.full_name} · ${new Date(shipment.received_at).toLocaleString('es-CL')}`
                      : step.key === 'received'
                        ? `${host?.full_name} confirmará la recepción`
                        : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {shipment.status === 'draft' ? (
          <div className="mt-5 border-t border-line-100 pt-5">
            <DispatchButton shipmentId={shipment.id} />
          </div>
        ) : null}
      </section>

      {/* --------------------------------------------------------- diferencia */}
      {discrepancy ? (
        <section className="rounded-card border border-danger-600/25 bg-danger-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-extrabold text-danger-700">
              {LABELS.discrepancyType[discrepancy.type]}
            </h2>
            <Badge tone="danger">{LABELS.discrepancyStatus[discrepancy.status]}</Badge>
          </div>

          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">
            {discrepancy.units_short > 0
              ? `Faltaron ${discrepancy.units_short} unidades respecto de lo declarado. `
              : ''}
            {discrepancy.units_over > 0
              ? `Llegaron ${discrepancy.units_over} unidades de más. `
              : ''}
            {Number(discrepancy.excess_m3 ?? 0) > 0
              ? `El volumen recibido excede en ${formatNumber(Number(discrepancy.excess_m3), 2)} m³ tu capacidad. `
              : ''}
            El pago sigue retenido en custodia mientras se resuelve.
          </p>

          {discrepancy.host_note ? (
            <blockquote className="mt-4 border-l-2 border-danger-600/40 pl-3 text-[13px] italic text-ink-700">
              “{discrepancy.host_note}” — {host?.full_name}
            </blockquote>
          ) : null}
        </section>
      ) : null}

      {/* --------------------------------------------------------- manifiesto */}
      <section className="card">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">Manifiesto</h2>
          <span className="text-[12.5px] text-ink-400">{formatNumber(unitTotal)} unidades</span>
        </div>

        <ul className="mt-3 divide-y divide-line-100">
          {(items ?? []).map((item) => {
            const gap = item.received_qty != null ? item.received_qty - item.declared_qty : null;
            return (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-navy-900">{item.name}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {item.sku}
                    {item.category ? ` · ${item.category}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[13.5px] font-bold text-navy-900 tabular-nums">
                    {item.received_qty != null ? `${item.received_qty} / ` : ''}
                    {item.declared_qty} u
                  </p>
                  {gap !== null && gap !== 0 ? (
                    <p className={`text-[11.5px] font-bold ${gap < 0 ? 'text-danger-700' : 'text-warning-700'}`}>
                      {gap > 0 ? '+' : ''}
                      {gap}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-surface-50 p-3">
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-[14px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
