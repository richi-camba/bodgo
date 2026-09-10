import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { HowItWorks } from '@/components/app/how-it-works';
import { PromoCard } from '@/components/app/promo-card';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Inicio' };

const ACCESOS: { href: string; icon: IconName; title: string; body: string }[] = [
  { href: '/app/buscar', icon: 'buscar', title: 'Buscar bodega', body: 'Contrata un espacio' },
  { href: '/app/pedidos', icon: 'pedidos', title: 'Mis pedidos', body: 'Envíos y entregas' },
  { href: '/app/inventario', icon: 'inventario', title: 'Mi inventario', body: 'Stock en tiempo real' },
  { href: '/app/metricas', icon: 'metricas', title: 'Métricas', body: 'KPIs y reportes' },
];

export default async function PymeHome() {
  const user = await requireUser('pyme');
  const supabase = await createClient();

  const desdeHoy = new Date();
  desdeHoy.setHours(0, 0, 0, 0);

  const [{ data: contracts }, { data: inventory }, { data: orders }, { data: notifications }] =
    await Promise.all([
      supabase.from('contracts').select('warehouse_id').eq('status', 'active'),
      supabase.from('inventory').select('quantity, product_id'),
      supabase
        .from('orders')
        .select('id, code, status, buyer_name, buyer_comuna, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('notifications')
        .select('id, title, body, created_at, read_at')
        .order('created_at', { ascending: false })
        .limit(4),
    ]);

  const { count: despachosHoy } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', desdeHoy.toISOString());

  const bodegas = new Set((contracts ?? []).map((c) => c.warehouse_id)).size;
  const skus = new Set((inventory ?? []).filter((i) => i.quantity > 0).map((i) => i.product_id)).size;

  const nombre = user.fullName.split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] text-ink-500">Hola, {nombre} 👋</p>
        <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight text-navy-900">
          Bienvenida a tu centro logístico
        </h1>
      </div>

      {/* Tres cifras, como en el prototipo: el número grande arriba y la
          etiqueta debajo, en tarjetas blancas de esquina 16. */}
      <dl className="grid grid-cols-3 gap-2.5">
        <Cifra valor={String(bodegas)} etiqueta={bodegas === 1 ? 'Bodega activa' : 'Bodegas activas'} />
        <Cifra valor={String(despachosHoy ?? 0)} etiqueta="Despachos hoy" />
        <Cifra valor={formatNumber(skus)} etiqueta="SKUs en stock" />
      </dl>

      <PromoCard />

      <HowItWorks />

      {/* ------------------------------------------------ accesos rápidos */}
      <section className="rounded-[20px] bg-navy-800 p-4">
        <h2 className="px-1 pb-3 text-[15px] font-extrabold text-white">Accesos rápidos</h2>
        <ul className="grid grid-cols-2 gap-2.5">
          {ACCESOS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="flex h-full flex-col rounded-[18px] bg-white/[0.07] p-4 transition-colors hover:bg-white/[0.12]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/15 text-white">
                  <Icon name={a.icon} size={17} />
                </span>
                <span className="mt-3 block text-[15px] font-extrabold text-white">{a.title}</span>
                <span className="mt-1 block text-[12px] text-white/70">{a.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ----------------------------------------------------- actividad */}
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
                    <p className="truncate text-[12px] text-ink-500">
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
            <p className="px-5 py-8 text-center text-[13.5px] text-ink-500">
              Todavía no tienes pedidos.
            </p>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-[15px] font-extrabold text-navy-900">Notificaciones</h2>
            <Link
              href="/app/notificaciones"
              className="text-[12.5px] font-bold text-brand-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {notifications?.length ? (
            <ul className="mt-3 divide-y divide-line-100">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-2 px-5 py-3.5">
                  {!n.read_at ? (
                    <span aria-label="Sin leer" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-navy-900">{n.title}</p>
                    {n.body ? (
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{n.body}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-[13.5px] text-ink-500">Nada por aquí.</p>
          )}
        </section>
      </div>
    </div>
  );
}

/** Cifra de la portada: número arriba, etiqueta debajo. */
function Cifra({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-[16px] bg-white p-3.5">
      <dt className="sr-only">{etiqueta}</dt>
      <dd>
        <span className="block text-[22px] font-extrabold leading-none text-navy-800 tabular-nums">
          {valor}
        </span>
        <span className="mt-1.5 block text-[11px] font-semibold leading-snug text-ink-500">
          {etiqueta}
        </span>
      </dd>
    </div>
  );
}
