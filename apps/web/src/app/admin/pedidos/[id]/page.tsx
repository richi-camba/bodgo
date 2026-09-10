import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, LABELS, shippingMargin, trackingUrlFor } from '@bodgo/core';

export const metadata: Metadata = { title: 'Pedido' };

const TONE: Record<string, Tone> = {
  pending: 'warning',
  queued: 'brand',
  picking: 'brand',
  ready: 'success',
  picked_up: 'neutral',
  in_transit: 'brand',
  delivered: 'success',
  cancelled: 'neutral',
};

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, code, status, channel, total_amount, shipping_cost, shipping_zone, buyer_name, buyer_comuna, pyme_id, created_at, delivered_at, courier_name, courier_cost, tracking_number, tracking_url, warehouses(comuna, code)',
    )
    .eq('id', id)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: items }, { data: events }, { data: pyme }] = await Promise.all([
    supabase.from('order_items').select('id, sku, name, quantity, unit_price').eq('order_id', id),
    supabase
      .from('order_events')
      .select('id, status, note, created_at')
      .eq('order_id', id)
      .order('created_at'),
    supabase.from('pyme_profiles').select('business_name').eq('profile_id', order.pyme_id).maybeSingle(),
  ]);

  // El courier vive en el propio pedido: BodGo no tiene flota, sólo registra
  // con quién salió, cuánto costó de verdad y con qué comprobante.
  const margen =
    order.courier_cost != null
      ? shippingMargin(order.shipping_cost ?? 0, order.courier_cost)
      : null;
  const enlace =
    order.tracking_url ??
    (order.courier_name && order.tracking_number
      ? trackingUrlFor(order.courier_name, order.tracking_number)
      : null);

  return (
    <div className="space-y-4">
      <StepHeader
        titulo={order.code}
        subtitulo={`${pyme?.business_name ?? 'PyME'} · ${order.warehouses?.comuna} → ${order.buyer_comuna}`}
        volverA="/admin/pedidos"
        tomaLaPantalla={false}
        accion={<Badge tone={TONE[order.status] ?? 'neutral'}>{LABELS.orderStatus[order.status]}</Badge>}
      />

      <section className="card p-4">
        <h2 className="text-[14px] font-extrabold text-navy-900">Datos del pedido</h2>
        <dl className="mt-3.5 space-y-2.5 text-[13px]">
          <Fila label="PyME" valor={pyme?.business_name ?? '—'} />
          <Fila label="Canal" valor={LABELS.salesChannel[order.channel] ?? 'Manual'} />
          <Fila label="Bodega origen" valor={`${order.warehouses?.comuna} · ${order.warehouses?.code}`} />
          <Fila label="Destino" valor={`${order.buyer_name} · ${order.buyer_comuna}`} />
          <Fila label="Creado" valor={new Date(order.created_at).toLocaleString('es-CL')} />
          {order.delivered_at ? (
            <Fila label="Entregado" valor={new Date(order.delivered_at).toLocaleString('es-CL')} />
          ) : null}
          <Fila label="Total" valor={formatCLP(order.total_amount ?? 0)} />
        </dl>
      </section>

      {/* ------------------------------------------------------- despacho */}
      <section className="card p-4">
        <h2 className="text-[14px] font-extrabold text-navy-900">Despacho</h2>

        {order.courier_name ? (
          <dl className="mt-3.5 space-y-2.5 text-[13px]">
            <Fila label="Courier" valor={order.courier_name} />
            <Fila
              label="Seguimiento"
              valor={
                order.tracking_number ? (
                  enlace ? (
                    <a
                      href={enlace}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-brand-600 hover:underline"
                    >
                      {order.tracking_number}
                    </a>
                  ) : (
                    order.tracking_number
                  )
                ) : (
                  '—'
                )
              }
            />
            <Fila label="Cobrado al comprador" valor={formatCLP(order.shipping_cost ?? 0)} />
            <Fila label="Pagado al courier" valor={formatCLP(order.courier_cost ?? 0)} />
            {margen != null ? (
              <div className="flex items-center justify-between gap-4 border-t border-line-100 pt-2.5">
                <dt className="text-ink-500">Margen de la PyME</dt>
                <dd
                  className={`font-extrabold tabular-nums ${margen >= 0 ? 'text-success-700' : 'text-danger-700'}`}
                >
                  {formatCLP(margen)}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
            Sin courier registrado todavía. El pedido no se puede marcar como retirado hasta que el
            bodeguero registre con quién sale: el comprador quedaría sin forma de seguirlo.
          </p>
        )}
      </section>

      {/* ---------------------------------------------------- trazabilidad */}
      <section className="card p-4">
        <h2 className="text-[14px] font-extrabold text-navy-900">Trazabilidad</h2>

        {events?.length ? (
          <ol className="mt-4 space-y-0">
            {events.map((e, i) => {
              const ultimo = i === events.length - 1;
              return (
                <li key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-600 text-white"
                    >
                      <Icon name="listo" size={13} />
                    </span>
                    {!ultimo ? <span className="my-1 w-0.5 flex-1 bg-success-600/40" /> : null}
                  </div>
                  <div className={ultimo ? '' : 'pb-4'}>
                    <p className="text-[13.5px] font-bold text-navy-900">
                      {LABELS.orderStatus[e.status]}
                    </p>
                    <p className="text-[11.5px] text-ink-500">
                      {[e.note, new Date(e.created_at).toLocaleString('es-CL')]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-2 text-[12.5px] text-ink-500">Sin hitos registrados.</p>
        )}
      </section>

      {/* --------------------------------------------------------- líneas */}
      <section className="card">
        <h2 className="px-4 pt-4 text-[14px] font-extrabold text-navy-900">Detalle</h2>
        <ul className="mt-2 divide-y divide-line-100">
          {(items ?? []).map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="shrink-0 text-[13.5px] font-extrabold text-navy-900 tabular-nums">
                {i.quantity}×
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-ink-700">{i.name}</p>
                <p className="font-mono text-[11px] text-ink-500">{i.sku}</p>
              </div>
              <span className="shrink-0 text-[13px] font-bold text-navy-900 tabular-nums">
                {formatCLP(i.unit_price * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold text-navy-900">{valor}</dd>
    </div>
  );
}
