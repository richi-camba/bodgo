import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Pedido' };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, warehouses(comuna, address)')
    .eq('id', id)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: items }, { data: events }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', id),
    supabase.from('order_events').select('*').eq('order_id', id).order('created_at'),
  ]);

  return (
    <div className="space-y-5">
      <Link href="/app/pedidos" className="inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a mis pedidos
      </Link>

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">{order.code}</h1>
            <p className="mt-1 text-[13.5px] text-ink-500">
              {order.external_ref ? `${order.external_ref} · ` : ''}
              Despacha desde {order.warehouses?.comuna}
            </p>
          </div>
          <Badge tone={order.status === 'delivered' ? 'success' : 'brand'}>
            {LABELS.orderStatus[order.status]}
          </Badge>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">Detalle de la venta</h2>
          <ul className="mt-4 divide-y divide-line-100">
            {(items ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-navy-900">
                    {item.quantity}× {item.name}
                  </p>
                  <p className="text-[11.5px] text-ink-400">{item.sku}</p>
                </div>
                <span className="text-[13.5px] font-bold text-navy-900 tabular-nums">
                  {formatCLP(item.unit_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line-100 pt-4 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-500">Venta</dt>
              <dd className="font-bold text-navy-900 tabular-nums">{formatCLP(order.items_total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">
                Envío{order.shipping_zone ? ` (${order.shipping_zone})` : ''}
              </dt>
              <dd className="font-bold text-navy-900 tabular-nums">{formatCLP(order.shipping_cost)}</dd>
            </div>
            <div className="flex justify-between border-t border-line-200 pt-2">
              <dt className="font-extrabold text-navy-900">Total operación</dt>
              <dd className="text-[16px] font-extrabold text-navy-900 tabular-nums">
                {formatCLP(order.total_amount ?? 0)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">Comprador</h2>
          <dl className="mt-4 space-y-3 text-[13.5px]">
            <Row label="Nombre" value={order.buyer_name} />
            {order.buyer_phone ? <Row label="Teléfono" value={order.buyer_phone} /> : null}
            <Row label="Dirección" value={`${order.buyer_address}, ${order.buyer_comuna}`} />
            {order.delivery_method ? (
              <Row label="Entrega" value={LABELS.deliveryMethod[order.delivery_method]} />
            ) : null}
            {order.tracking_url ? (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Seguimiento</dt>
                <dd className="mt-0.5">
                  <a href={order.tracking_url} className="font-bold text-brand-600 hover:underline" rel="noopener noreferrer" target="_blank">
                    {order.courier_name ?? 'Ver seguimiento'} ↗
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          {order.delivery_notes ? (
            <p className="mt-4 rounded-field bg-surface-50 p-3 text-[12.5px] leading-relaxed text-ink-700">
              Nota: {order.delivery_notes}
            </p>
          ) : null}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Trazabilidad</h2>
        {events?.length ? (
          <ol className="mt-4 space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success-600" />
                <div>
                  <p className="text-[13.5px] font-bold text-navy-900">{LABELS.orderStatus[e.status]}</p>
                  <p className="text-[12px] text-ink-400">
                    {new Date(e.created_at).toLocaleString('es-CL')}
                    {e.note ? ` · ${e.note}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-[13px] text-ink-400">Sin movimientos todavía.</p>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-navy-900">{value}</dd>
    </div>
  );
}
