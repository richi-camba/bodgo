import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, LABELS } from '@bodgo/core';
import { ReceptionForm } from './reception-form';

export const metadata: Metadata = { title: 'Verificar recepción' };

export default async function ReceptionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: shipment } = await supabase
    .from('shipments')
    .select(
      'id, code, description, packages_count, weight_kg, status, declared_volume_m3, received_volume_m3, capacity_m3, host_note, received_at, pyme_id, warehouse_id, warehouses(comuna, total_m2)',
    )
    .eq('id', id)
    .maybeSingle();

  if (!shipment) notFound();

  const [{ data: items }, { data: pyme }, { data: discrepancy }] = await Promise.all([
    supabase.from('shipment_items').select('*').eq('shipment_id', id).order('name'),
    supabase.from('pyme_profiles').select('business_name, phone').eq('profile_id', shipment.pyme_id).maybeSingle(),
    supabase.from('discrepancies').select('*').eq('shipment_id', id).maybeSingle(),
  ]);

  const capacityM3 = Number(shipment.capacity_m3 ?? 0);
  const pending = shipment.status === 'in_transit';

  return (
    <div className="space-y-5">
      <Link href="/bodeguero/recepciones" className="inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a recepciones
      </Link>

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">
              {pyme?.business_name ?? 'PyME'}
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-500">
              {shipment.code} · {shipment.packages_count} bultos · {shipment.warehouses?.comuna}
            </p>
          </div>
          <Badge tone={shipment.status === 'discrepancy' ? 'danger' : pending ? 'brand' : 'success'}>
            {LABELS.shipmentStatus[shipment.status]}
          </Badge>
        </div>

        {shipment.description ? (
          <p className="mt-4 rounded-field bg-surface-50 p-3.5 text-[13px] text-ink-700">
            {shipment.description}
            {shipment.weight_kg ? ` · ${formatNumber(Number(shipment.weight_kg), 1)} kg` : ''}
          </p>
        ) : null}
      </header>

      {pending ? (
        <ReceptionForm
          shipmentId={shipment.id}
          declaredVolumeM3={Number(shipment.declared_volume_m3 ?? 0)}
          capacityM3={capacityM3}
          items={(items ?? []).map((i) => ({
            productId: i.product_id,
            sku: i.sku,
            name: i.name,
            category: i.category,
            declared: i.declared_qty,
          }))}
        />
      ) : (
        <>
          {discrepancy ? (
            <section className="rounded-card border border-danger-600/25 bg-danger-50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-extrabold text-danger-600">
                  {LABELS.discrepancyType[discrepancy.type]}
                </h2>
                <Badge tone="danger">{LABELS.discrepancyStatus[discrepancy.status]}</Badge>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">
                Registraste {discrepancy.received_units} unidades contra{' '}
                {discrepancy.declared_units} declaradas. La PyME quedó notificada y el caso está
                abierto para el equipo BodGo.
              </p>
              {discrepancy.host_note ? (
                <p className="mt-3 text-[13px] italic text-ink-700">“{discrepancy.host_note}”</p>
              ) : null}
            </section>
          ) : (
            <section className="rounded-card border border-success-600/25 bg-success-50 p-6">
              <h2 className="text-[15px] font-extrabold text-success-700">Recepción verificada ✓</h2>
              <p className="mt-1.5 text-[13.5px] text-ink-700">
                Todo coincidió con el manifiesto. El stock ya está en el inventario de la PyME y el
                pago quedó liberado para tu liquidación de fin de mes.
              </p>
            </section>
          )}

          <section className="card">
            <h2 className="px-5 pt-5 text-[15px] font-extrabold text-navy-900">Conteo registrado</h2>
            <ul className="mt-3 divide-y divide-line-100">
              {(items ?? []).map((item) => {
                const gap = (item.received_qty ?? item.declared_qty) - item.declared_qty;
                return (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-navy-900">{item.name}</p>
                      <p className="text-[11.5px] text-ink-400">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13.5px] font-bold text-navy-900 tabular-nums">
                        {item.received_qty ?? item.declared_qty} / {item.declared_qty} u
                      </p>
                      {gap !== 0 ? (
                        <p className={`text-[11.5px] font-bold ${gap < 0 ? 'text-danger-600' : 'text-warning-600'}`}>
                          {gap > 0 ? '+' : ''}
                          {gap}
                        </p>
                      ) : (
                        <p className="text-[11.5px] font-bold text-success-600">coincide</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
