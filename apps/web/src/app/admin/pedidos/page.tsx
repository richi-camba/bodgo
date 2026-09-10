import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Pedidos de la red' };

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

type Search = { estado?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { estado } = await searchParams;
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(
      'id, code, status, total_amount, buyer_name, buyer_comuna, pyme_id, created_at, delivered_at, warehouses(comuna)',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  const pymeIds = [...new Set((orders ?? []).map((o) => o.pyme_id))];
  const { data: pymes } = pymeIds.length
    ? await supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', pymeIds)
    : { data: [] };
  const negocio = new Map((pymes ?? []).map((p) => [p.profile_id, p.business_name]));

  const hoy = new Date().toDateString();
  const deHoy = (orders ?? []).filter((o) => new Date(o.created_at).toDateString() === hoy);
  const enRuta = (orders ?? []).filter((o) => ['picked_up', 'in_transit'].includes(o.status));
  const entregados = (orders ?? []).filter((o) => o.status === 'delivered');

  const presentes = [...new Set((orders ?? []).map((o) => o.status))];
  const visibles = estado ? (orders ?? []).filter((o) => o.status === estado) : (orders ?? []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pedidos de la red"
        subtitle="Todos los movimientos, de cualquier PyME y cualquier bodega."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={deHoy.length} label="Pedidos hoy" orden="etiqueta-primero" />
        <Stat value={enRuta.length} label="En ruta" orden="etiqueta-primero" />
        <Stat value={entregados.length} label="Entregados" orden="etiqueta-primero" />
        <Stat value={orders?.length ?? 0} label="Total en el listado" orden="etiqueta-primero" />
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <Pastilla href="/admin/pedidos" activa={!estado}>
          TODOS · {orders?.length ?? 0}
        </Pastilla>
        {presentes.map((s) => (
          <Pastilla key={s} href={`/admin/pedidos?estado=${s}`} activa={estado === s}>
            {LABELS.orderStatus[s]} · {(orders ?? []).filter((o) => o.status === s).length}
          </Pastilla>
        ))}
      </div>

      {!visibles.length ? (
        <EmptyState
          icon="pedidos"
          title="Sin pedidos"
          body="Acá aparecen todos los pedidos de la red a medida que las PyMEs los reciben desde sus canales de venta."
        />
      ) : (
        <ul className="space-y-2.5">
          {visibles.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/pedidos/${o.id}`}
                className="flex items-center gap-3 rounded-[14px] border border-line-100 bg-white p-4 transition-colors hover:border-navy-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-bold text-navy-800">{o.code}</span>
                    <Badge tone={TONE[o.status] ?? 'neutral'}>{LABELS.orderStatus[o.status]}</Badge>
                  </div>
                  <p className="mt-1 truncate text-[13.5px] font-bold text-navy-900">
                    {negocio.get(o.pyme_id) ?? 'PyME'}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-500">
                    {o.warehouses?.comuna} → {o.buyer_comuna} ·{' '}
                    {new Date(o.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>

                <span className="shrink-0 text-right text-[13.5px] font-extrabold text-navy-900 tabular-nums">
                  {formatCLP(o.total_amount ?? 0)}
                </span>
                <span aria-hidden className="shrink-0 text-line-300">
                  <Icon name="siguiente" size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Pastilla({
  href,
  activa,
  children,
}: {
  href: string;
  activa: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? 'page' : undefined}
      className={`shrink-0 rounded-pill px-3.5 py-2 text-[12px] font-bold transition-colors ${
        activa ? 'bg-navy-800 text-white' : 'bg-surface-100 text-ink-700 hover:bg-line-100'
      }`}
    >
      {children}
    </Link>
  );
}
