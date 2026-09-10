import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon, type IconName } from '@/components/ui/icon';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, LABELS } from '@bodgo/core';
import { OrderRow } from './order-row';
import { OrderTabs } from './tabs';

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
  received: 'success',
  discrepancy: 'danger',
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

const ICONO: Record<string, IconName> = {
  in_transit: 'envios',
  received: 'recibido',
  discrepancy: 'discrepancias',
};

type Search = { tipo?: string; estado?: string };

/** Pastillas de estado con su cuenta, en el orden en que aparecen en la lista. */
function chips<T extends string>(
  filas: { status: T }[],
  rotulo: (estado: T) => string,
): { id: string; label: string; count: number }[] {
  const presentes = [...new Set(filas.map((f) => f.status))];
  return [
    { id: 'todos', label: 'TODOS', count: filas.length },
    ...presentes.map((s) => ({
      id: s,
      label: rotulo(s),
      count: filas.filter((f) => f.status === s).length,
    })),
  ];
}

/**
 * La bandeja del bodeguero: lo que hay que despachar y lo que hay que recibir,
 * en una sola pantalla con dos pestañas, como en el prototipo. Son el mismo
 * turno de trabajo — tenerlas en secciones separadas obligaba a mirar en dos
 * lugares para saber qué toca ahora.
 */
export default async function HostOrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const tipo = params.tipo === 'recibir' ? 'recibir' : 'enviar';
  const estado = params.estado ?? 'todos';
  const supabase = await createClient();

  const [{ data: orders }, { data: shipments }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, code, status, buyer_name, buyer_comuna, pyme_id, created_at, warehouses(comuna)')
      .order('created_at', { ascending: false }),
    supabase
      .from('shipments')
      .select(
        'id, code, description, packages_count, declared_volume_m3, received_volume_m3, capacity_m3, status, dispatched_at, received_at, pyme_id, warehouses(comuna)',
      )
      .in('status', ['in_transit', 'received', 'discrepancy'])
      .order('dispatched_at', { ascending: false }),
  ]);

  const pymeIds = [
    ...new Set([...(orders ?? []).map((o) => o.pyme_id), ...(shipments ?? []).map((s) => s.pyme_id)]),
  ];
  const { data: pymes } = pymeIds.length
    ? await supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', pymeIds)
    : { data: [] };
  const negocio = new Map((pymes ?? []).map((p) => [p.profile_id, p.business_name]));

  const { data: items } = await supabase
    .from('order_items')
    .select('order_id, sku, name, quantity')
    .in('order_id', (orders ?? []).map((o) => o.id));

  const itemsByOrder = new Map<string, { sku: string; name: string; quantity: number }[]>();
  for (const i of items ?? []) {
    itemsByOrder.set(i.order_id, [...(itemsByOrder.get(i.order_id) ?? []), i]);
  }

  const paraEnviar = orders ?? [];
  const paraRecibir = shipments ?? [];

  // Las pastillas se arman con los estados presentes en la pestaña abierta:
  // ofrecer un filtro que deja la lista vacía es ruido.
  const estados =
    tipo === 'recibir'
      ? chips(paraRecibir, (s) => LABELS.shipmentStatus[s])
      : chips(paraEnviar, (s) => LABELS.orderStatus[s]);

  const envios = estado === 'todos' ? paraRecibir : paraRecibir.filter((s) => s.status === estado);
  const pedidos = estado === 'todos' ? paraEnviar : paraEnviar.filter((o) => o.status === estado);
  const vacio = tipo === 'recibir' ? envios.length === 0 : pedidos.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Pedidos" subtitle="Recepciones y preparación" />

      <OrderTabs
        tipo={tipo}
        estado={estado}
        estados={estados}
        totales={{
          enviar: paraEnviar.filter((o) => NEXT_STEP[o.status]).length,
          recibir: paraRecibir.filter((s) => s.status === 'in_transit').length,
        }}
      />

      {vacio ? (
        <EmptyState
          icon={tipo === 'recibir' ? 'recepciones' : 'pedidos'}
          title={tipo === 'recibir' ? 'No hay mercadería en camino' : 'Nada por preparar'}
          body={
            tipo === 'recibir'
              ? 'Cuando una PyME despache un envío a tus espacios, aparecerá acá para que lo cuentes contra el manifiesto.'
              : 'Cuando una PyME con stock en tus espacios reciba una venta, el pedido aparece acá para que lo armes.'
          }
        />
      ) : tipo === 'recibir' ? (
        <ul className="space-y-2.5">
          {envios.map((s) => (
            <li key={s.id}>
              <Link
                href={`/bodeguero/recepciones/${s.id}`}
                className="block rounded-[16px] border border-line-100 bg-white p-3.5 shadow-[0_2px_6px_rgba(16,36,58,.04)] transition-colors hover:border-navy-800"
              >
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-navy-800">{s.code}</span>
                  <Badge tone={TONE[s.status] ?? 'neutral'}>{LABELS.shipmentStatus[s.status]}</Badge>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] ${
                      s.status === 'discrepancy'
                        ? 'bg-danger-50 text-danger-700'
                        : s.status === 'received'
                          ? 'bg-success-50 text-success-700'
                          : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    <Icon name={ICONO[s.status] ?? 'recepciones'} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-navy-900">
                      {negocio.get(s.pyme_id) ?? 'PyME'}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-500">
                      {s.packages_count} {s.packages_count === 1 ? 'bulto' : 'bultos'} ·{' '}
                      {formatNumber(Number(s.declared_volume_m3 ?? 0), 2)} m³ ·{' '}
                      {s.warehouses?.comuna}
                    </p>
                  </div>
                  <span aria-hidden className="shrink-0 text-line-300">
                    <Icon name="siguiente" size={14} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2.5">
          {pedidos.map((o) => (
            <OrderRow
              key={o.id}
              order={{
                id: o.id,
                code: o.code,
                status: o.status,
                statusLabel: LABELS.orderStatus[o.status],
                tone: TONE[o.status] ?? 'neutral',
                business: negocio.get(o.pyme_id) ?? 'PyME',
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
    </div>
  );
}
