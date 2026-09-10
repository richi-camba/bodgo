import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/icon';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Inicio' };

const QUICK_LINKS: { href: string; icon: IconName; title: string; body: string }[] = [
  { href: '/app/buscar', icon: 'buscar', title: 'Buscar bodega', body: 'Contrata un espacio' },
  { href: '/app/despachos/nuevo', icon: 'envios', title: 'Enviar mercancía', body: 'Manifiesto y despacho' },
  { href: '/app/inventario', icon: 'inventario', title: 'Mi inventario', body: 'Stock en tiempo real' },
  { href: '/app/metricas', icon: 'metricas', title: 'Métricas', body: 'KPIs y reportes' },
];

export default async function PymeHome() {
  const user = await requireUser('pyme');
  const supabase = await createClient();

  const [{ data: contracts }, { data: inventory }, { data: orders }, { data: notifications }] =
    await Promise.all([
      supabase
        .from('contracts')
        .select('id, m2, status, warehouse_id, warehouses(comuna)')
        .eq('status', 'active'),
      supabase.from('inventory').select('quantity, product_id'),
      supabase
        .from('orders')
        .select('id, code, status, buyer_name, buyer_comuna, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('notifications')
        .select('id, title, body, created_at, read_at')
        .order('created_at', { ascending: false })
        .limit(4),
    ]);

  const activeWarehouses = new Set((contracts ?? []).map((c) => c.warehouse_id)).size;
  const units = (inventory ?? []).reduce((sum, i) => sum + i.quantity, 0);
  const skus = new Set((inventory ?? []).filter((i) => i.quantity > 0).map((i) => i.product_id)).size;
  const openOrders = (orders ?? []).filter(
    (o) => !['delivered', 'cancelled'].includes(o.status),
  ).length;

  const firstName = user.fullName.split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13.5px] text-ink-500">Hola, {firstName} 👋</p>
        <h1 className="mt-0.5 text-[24px] font-extrabold tracking-tight text-navy-900">
          Bienvenida a tu centro logístico
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={activeWarehouses} label={activeWarehouses === 1 ? 'Bodega activa' : 'Bodegas activas'} />
        <Stat value={openOrders} label="Pedidos en curso" />
        <Stat value={skus} label="SKUs en stock" />
        <Stat value={formatNumber(units)} label="Unidades guardadas" />
      </div>

      {activeWarehouses === 0 ? (
        <section className="overflow-hidden rounded-[20px] bg-navy-800 p-7 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-400">Para PyMEs</p>
          <h2 className="mt-3 max-w-sm text-[24px] font-extrabold leading-tight tracking-tight">
            Acerca tu stock a tus clientes
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/70">
            Contrata una microbodega cerca de tu demanda y despacha más rápido, sin bodega propia.
          </p>
          <ButtonLink
            href="/app/buscar"
            className="mt-6 border-transparent bg-white text-navy-800 hover:bg-white/90"
            variant="secondary"
          >
            Buscar microbodega
          </ButtonLink>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">Accesos rápidos</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="card flex h-full flex-col gap-2 p-4 transition-shadow hover:shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-50 text-brand-600">
                  <Icon name={link.icon} size={18} />
                </span>
                <span className="text-[13.5px] font-extrabold text-navy-900">{link.title}</span>
                <span className="text-[11.5px] text-ink-400">{link.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-[15px] font-extrabold text-navy-900">Últimos pedidos</h2>
            <Link href="/app/pedidos" className="text-[12.5px] font-bold text-brand-600 hover:underline">
              Ver todos
            </Link>
          </div>

          {orders?.length ? (
            <ul className="mt-3 divide-y divide-line-100">
              {orders.map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-navy-900">{order.code}</p>
                    <p className="truncate text-[12px] text-ink-400">
                      {order.buyer_name} · {order.buyer_comuna}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold text-navy-900 tabular-nums">
                    {formatCLP(order.total_amount ?? 0)}
                  </span>
                  <Badge tone={order.status === 'delivered' ? 'success' : 'brand'}>
                    {LABELS.orderStatus[order.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-[13.5px] text-ink-400">
              Todavía no tienes pedidos.
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="px-5 pt-5 text-[15px] font-extrabold text-navy-900">Notificaciones</h2>

          {notifications?.length ? (
            <ul className="mt-3 divide-y divide-line-100">
              {notifications.map((n) => (
                <li key={n.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-2">
                    {!n.read_at ? (
                      <span aria-label="Sin leer" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-navy-900">{n.title}</p>
                      {n.body ? <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{n.body}</p> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-[13.5px] text-ink-400">Nada por aquí.</p>
          )}
        </section>
      </div>
    </div>
  );
}
