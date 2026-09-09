import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Logo } from '@/components/ui/logo';
import { Icon } from '@/components/ui/icon';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, LABELS } from '@bodgo/core';

export const metadata: Metadata = {
  title: 'Seguimiento de tu pedido',
  // El enlace es la única llave: que no se indexe.
  robots: { index: false, follow: false },
};

/** Los hitos que ve el comprador, en orden. */
const STEPS = [
  { key: 'queued', label: 'Pedido recibido', detail: 'Lo estamos preparando' },
  { key: 'picking', label: 'Preparando en bodega', detail: 'Armando tu paquete' },
  { key: 'ready', label: 'Listo para despacho', detail: 'Esperando al courier' },
  { key: 'picked_up', label: 'Retirado por el courier', detail: 'Ya salió de la bodega' },
  { key: 'in_transit', label: 'En camino', detail: 'Va hacia tu dirección' },
  { key: 'delivered', label: 'Entregado', detail: 'Llegó a destino' },
] as const;

const ORDER = STEPS.map((s) => s.key) as readonly string[];

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Un token con forma inválida no llega a consultar la base.
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const supabase = await createClient();

  const [{ data: rows }, { data: items }, { data: events }] = await Promise.all([
    supabase.rpc('track_order', { p_token: token }),
    supabase.rpc('track_order_items', { p_token: token }),
    supabase.rpc('track_order_events', { p_token: token }),
  ]);

  const order = rows?.[0];
  if (!order) notFound();

  const cancelled = order.status === 'cancelled';
  const reached = ORDER.indexOf(order.status ?? 'queued');

  const timeOf = (key: string) => {
    const event = events?.find((e) => e.status === key);
    return event
      ? new Date(event.created_at).toLocaleString('es-CL', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-line-100 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
          <Link href="/" aria-label="BodGo">
            <Logo size={20} />
          </Link>
          <span className="text-[12px] font-semibold text-ink-400">Pedido {order.code}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-5 py-8">
        <div>
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-navy-900">
            {cancelled
              ? 'Este pedido fue cancelado'
              : order.status === 'delivered'
                ? '¡Tu pedido llegó!'
                : 'Tu pedido va en camino'}
          </h1>
          <p className="mt-1.5 text-[14.5px] text-ink-500">
            Hola {order.buyer_name?.split(' ')[0]}, acá puedes seguir tu compra.
          </p>
        </div>

        {/* --------------------------------------------------------- estado */}
        {!cancelled ? (
          <section className="card p-6">
            <ol>
              {STEPS.map((step, i) => {
                const done = i <= reached;
                const current = i === reached;
                const isLast = i === STEPS.length - 1;
                const when = timeOf(step.key);

                return (
                  <li key={step.key} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          done ? 'bg-success-600 text-white' : 'bg-line-100 text-ink-400'
                        }`}
                      >
                        {done ? (
                          <Icon name="listo" size={15} />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      {!isLast ? (
                        <span
                          className={`my-1 w-0.5 flex-1 ${done && i < reached ? 'bg-success-600' : 'bg-line-200'}`}
                        />
                      ) : null}
                    </div>

                    <div className={isLast ? 'pb-0' : 'pb-6'}>
                      <p
                        className={`text-[14.5px] font-bold ${
                          current ? 'text-navy-900' : done ? 'text-ink-700' : 'text-ink-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[12.5px] text-ink-400">{when ?? step.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {/* -------------------------------------------------------- courier */}
        {order.courier_name && !cancelled ? (
          <section className="card p-5">
            <h2 className="text-eyebrow">Despachado con</h2>
            <p className="mt-2 text-[15px] font-extrabold text-navy-900">{order.courier_name}</p>
            {order.tracking_number ? (
              <p className="mt-0.5 text-[13px] text-ink-500">
                Seguimiento {order.tracking_number}
              </p>
            ) : null}
            {order.tracking_url ? (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-field border border-line-200 px-4 py-2.5 text-[13px] font-bold text-navy-800 transition-colors hover:border-navy-800"
              >
                <Icon name="mapa" size={15} />
                Ver seguimiento en {order.courier_name}
              </a>
            ) : null}
          </section>
        ) : null}

        {/* ---------------------------------------------------------- pedido */}
        <section className="card p-5">
          <h2 className="text-eyebrow">Tu pedido</h2>
          <ul className="mt-3 divide-y divide-line-100">
            {(items ?? []).map((item) => (
              <li key={item.sku} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[13.5px] text-navy-900">
                  <strong className="font-bold">{item.quantity}×</strong> {item.name}
                </span>
                <span className="text-[13.5px] font-bold text-navy-900 tabular-nums">
                  {formatCLP(item.unit_price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-2 border-t border-line-100 pt-3 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-500">Envío</dt>
              <dd className="font-bold text-navy-900 tabular-nums">
                {formatCLP(order.shipping_cost ?? 0)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line-200 pt-2">
              <dt className="font-extrabold text-navy-900">Total</dt>
              <dd className="text-[16px] font-extrabold text-navy-900 tabular-nums">
                {formatCLP(order.total_amount ?? 0)}
              </dd>
            </div>
          </dl>
        </section>

        {/* --------------------------------------------------------- destino */}
        <section className="card p-5">
          <h2 className="text-eyebrow">Entrega en</h2>
          <p className="mt-2 text-[14.5px] font-semibold text-navy-900">
            {order.buyer_address}
          </p>
          <p className="text-[13px] text-ink-500">{order.buyer_comuna}, Región Metropolitana</p>
          {order.delivery_notes ? (
            <p className="mt-3 rounded-field bg-surface-50 p-3 text-[12.5px] leading-relaxed text-ink-700">
              Nota: {order.delivery_notes}
            </p>
          ) : null}
          <p className="mt-4 text-[12px] text-ink-400">
            Sale desde nuestra microbodega de {order.origin_comuna}.
          </p>
        </section>

        {cancelled ? (
          <p className="card p-5 text-[13.5px] leading-relaxed text-ink-700">
            Este pedido quedó cancelado ({LABELS.orderStatus.cancelled.toLowerCase()}). Si crees que
            es un error, contacta a la tienda donde compraste.
          </p>
        ) : null}

        <p className="pt-2 text-center text-[12px] text-ink-400">
          Despachado con BodGo · red de microbodegas urbanas
        </p>
      </main>
    </div>
  );
}
