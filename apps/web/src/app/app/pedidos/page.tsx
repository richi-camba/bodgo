import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, type Tone } from '@/components/ui/badge';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Mis pedidos' };

const TONE: Record<string, Tone> = {
  pending: 'warning',
  queued: 'brand',
  picking: 'brand',
  ready: 'brand',
  picked_up: 'brand',
  in_transit: 'brand',
  delivered: 'success',
  cancelled: 'neutral',
};

const CHANNEL_LABEL: Record<string, string> = {
  mercadolibre: 'Mercado Libre',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  manual: 'Manual',
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, code, external_ref, channel, buyer_name, buyer_comuna, status, total_amount, created_at, warehouses(comuna)')
    .order('created_at', { ascending: false });

  const open = (orders ?? []).filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const delivered = (orders ?? []).filter((o) => o.status === 'delivered');
  const revenue = delivered.reduce((s, o) => s + (o.total_amount ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Mis pedidos" subtitle="Ventas que se despachan desde tus microbodegas." />

      <div className="grid grid-cols-3 gap-3">
        <Stat value={open.length} label="En curso" />
        <Stat value={delivered.length} label="Entregados" />
        <Stat value={formatCLP(revenue)} label="Facturado entregado" />
      </div>

      {!orders?.length ? (
        <EmptyState
          icon="📋"
          title="Todavía no tienes pedidos"
          body="Cuando conectes tu canal de venta, las ventas entran solas acá y el bodeguero recibe el aviso para preparar el despacho."
        />
      ) : (
        <ul className="space-y-2.5">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/app/pedidos/${o.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-extrabold text-navy-900">{o.code}</h2>
                    <Badge tone={TONE[o.status] ?? 'neutral'}>{LABELS.orderStatus[o.status]}</Badge>
                    <span className="text-[11px] font-semibold text-ink-400">
                      {CHANNEL_LABEL[o.channel]}
                      {o.external_ref ? ` · ${o.external_ref}` : ''}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-400">
                    {o.buyer_name} · {o.buyer_comuna} · desde {o.warehouses?.comuna}
                  </p>
                </div>

                <span className="text-[15px] font-extrabold text-navy-900 tabular-nums">
                  {formatCLP(o.total_amount ?? 0)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
