import type { Metadata } from 'next';
import { Badge, type Tone } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { LABELS } from '@bodgo/core';
import { OrderRow } from './order-row';

export const metadata: Metadata = { title: 'Pedidos' };

const TONE: Record<string, Tone> = {
  pending: 'warning',
  queued: 'brand',
  picking: 'brand',
  ready: 'success',
  picked_up: 'neutral',
  in_transit: 'neutral',
  delivered: 'success',
  cancelled: 'neutral',
};

/** Siguiente paso que le toca al bodeguero en cada estado. */
const NEXT_STEP: Record<string, { status: string; label: string } | null> = {
  pending: { status: 'queued', label: 'Poner en cola' },
  queued: { status: 'picking', label: 'Empezar el picking' },
  picking: { status: 'ready', label: 'Marcar listo para retiro' },
  ready: { status: 'picked_up', label: 'Entregar al courier' },
  picked_up: null,
  in_transit: null,
  delivered: null,
  cancelled: null,
};

export default async function HostOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, code, status, buyer_name, buyer_comuna, pyme_id, created_at, warehouses(comuna)')
    .order('created_at', { ascending: false });

  const pymeIds = [...new Set((orders ?? []).map((o) => o.pyme_id))];
  const { data: pymes } = pymeIds.length
    ? await supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', pymeIds)
    : { data: [] };
  const businessById = new Map((pymes ?? []).map((p) => [p.profile_id, p.business_name]));

  const { data: items } = await supabase
    .from('order_items')
    .select('order_id, sku, name, quantity')
    .in('order_id', (orders ?? []).map((o) => o.id));

  const itemsByOrder = new Map<string, { sku: string; name: string; quantity: number }[]>();
  for (const i of items ?? []) {
    itemsByOrder.set(i.order_id, [...(itemsByOrder.get(i.order_id) ?? []), i]);
  }

  const active = (orders ?? []).filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const closed = (orders ?? []).filter((o) => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        subtitle="Prepara el pedido y entrégalo al courier o al comprador."
      />

      <section>
        <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">
          Por preparar {active.length > 0 ? `(${active.length})` : ''}
        </h2>

        {active.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nada por preparar"
            body="Cuando una PyME con stock en tus espacios reciba una venta, el pedido aparece acá para que lo armes."
          />
        ) : (
          <ul className="space-y-2.5">
            {active.map((o) => (
              <OrderRow
                key={o.id}
                order={{
                  id: o.id,
                  code: o.code,
                  status: o.status,
                  statusLabel: LABELS.orderStatus[o.status],
                  tone: TONE[o.status] ?? 'neutral',
                  business: businessById.get(o.pyme_id) ?? 'PyME',
                  from: o.warehouses?.comuna ?? '',
                  to: o.buyer_comuna,
                  buyer: o.buyer_name,
                }}
                items={itemsByOrder.get(o.id) ?? []}
                next={NEXT_STEP[o.status] ?? null}
              />
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">Cerrados</h2>
          <ul className="space-y-2">
            {closed.map((o) => (
              <li key={o.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-[13.5px] font-bold text-navy-900">{o.code}</p>
                  <p className="text-[12px] text-ink-400">
                    {businessById.get(o.pyme_id)} · {o.warehouses?.comuna} → {o.buyer_comuna}
                  </p>
                </div>
                <Badge tone={TONE[o.status] ?? 'neutral'}>{LABELS.orderStatus[o.status]}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
