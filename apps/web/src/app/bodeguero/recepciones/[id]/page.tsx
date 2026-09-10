import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { StepHeader } from '@/components/app/step-header';
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

  const meta = [
    pyme?.business_name,
    `${shipment.packages_count} ${shipment.packages_count === 1 ? 'bulto' : 'bultos'}`,
    shipment.warehouses?.comuna,
  ]
    .filter(Boolean)
    .join(' · ');

  // Mientras hay que contar, la pantalla es un flujo que se termina y toma
  // el ancho completo. Ya registrada pasa a ser una ficha que se consulta, y
  // la barra de pestañas vuelve.
  if (shipment.status === 'in_transit') {
    return (
      <div>
        <StepHeader titulo="Verificar recepción" subtitulo={meta} volverA="/bodeguero/recepciones" />

        {shipment.description ? (
          <p className="mb-4 rounded-field bg-white p-3.5 text-[13px] text-ink-700">
            {shipment.description}
            {shipment.weight_kg ? ` · ${formatNumber(Number(shipment.weight_kg), 1)} kg` : ''}
          </p>
        ) : null}

        <ReceptionForm
          shipmentId={shipment.id}
          code={shipment.code}
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StepHeader
        titulo="Recepción registrada"
        subtitulo={meta}
        volverA="/bodeguero/recepciones"
        tomaLaPantalla={false}
        accion={
          <Badge tone={shipment.status === 'discrepancy' ? 'danger' : 'success'}>
            {LABELS.shipmentStatus[shipment.status]}
          </Badge>
        }
      />

      {discrepancy ? (
        <section className="rounded-[16px] border-[1.5px] border-danger-600/25 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13.5px] font-extrabold text-danger-700">
              {LABELS.discrepancyType[discrepancy.type]}
            </h2>
            <Badge tone="danger">{LABELS.discrepancyStatus[discrepancy.status]}</Badge>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">
            Registraste {formatNumber(discrepancy.received_units)} unidades contra{' '}
            {formatNumber(discrepancy.declared_units)} declaradas. La PyME quedó notificada y el
            caso está abierto para el equipo BodGo.
          </p>
          {discrepancy.host_note ? (
            <p className="mt-3 border-l-2 border-danger-600/40 pl-3 text-[12.5px] italic text-ink-700">
              “{discrepancy.host_note}”
            </p>
          ) : null}
        </section>
      ) : (
        <section className="flex items-center gap-2.5 rounded-[14px] bg-success-50 p-3.5">
          <span className="shrink-0 text-success-700">
            <Icon name="listo" size={20} />
          </span>
          <div>
            <p className="text-[13.5px] font-extrabold text-success-700">Recepción verificada</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-700">
              Todo coincidió con el manifiesto. El stock ya está en el inventario de la PyME y el
              pago quedó liberado para tu liquidación de fin de mes.
            </p>
          </div>
        </section>
      )}

      <section className="card">
        <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
          <h2 className="text-[14px] font-extrabold text-navy-900">Conteo registrado</h2>
          {shipment.received_at ? (
            <span className="text-[11.5px] text-ink-500">
              {new Date(shipment.received_at).toLocaleDateString('es-CL')}
            </span>
          ) : null}
        </div>

        <ul className="mt-2 divide-y divide-line-100">
          {(items ?? []).map((item) => {
            const gap = (item.received_qty ?? item.declared_qty) - item.declared_qty;
            return (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-navy-900">{item.name}</p>
                  <p className="text-[11.5px] text-ink-500">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13.5px] font-bold text-navy-900 tabular-nums">
                    {item.received_qty ?? item.declared_qty} / {item.declared_qty} u
                  </p>
                  {gap !== 0 ? (
                    <p
                      className={`text-[11.5px] font-bold ${gap < 0 ? 'text-danger-700' : 'text-warning-700'}`}
                    >
                      {gap > 0 ? '+' : ''}
                      {gap}
                    </p>
                  ) : (
                    <p className="text-[11.5px] font-bold text-success-700">coincide</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {shipment.received_volume_m3 != null ? (
        <p className="text-[12px] text-ink-500">
          Volumen medido al recibir: {formatNumber(Number(shipment.received_volume_m3), 2)} m³ sobre{' '}
          {formatNumber(capacityM3, 1)} m³ de capacidad.
        </p>
      ) : null}
    </div>
  );
}
