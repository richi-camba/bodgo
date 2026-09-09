'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createOrder, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select, Textarea } from '@/components/ui/field';
import { COMUNA_CENTROIDS, formatCLP, formatNumber, quoteDeliveryToComuna } from '@bodgo/core';

type Warehouse = {
  id: string;
  comuna: string;
  lat: number | null;
  lng: number | null;
  items: { id: string; name: string; sku: string; stock: number }[];
};

const COMUNAS = Object.keys(COMUNA_CENTROIDS).filter((c) => c !== 'Santiago Centro').sort();

export function OrderBuilder({ warehouses }: { warehouses: Warehouse[] }) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]!.id);
  const [comuna, setComuna] = useState('');
  const [method, setMethod] = useState<'bodgo_courier' | 'external_courier' | 'buyer_pickup'>('bodgo_courier');
  const [lines, setLines] = useState<Record<string, { qty: number; unitPrice: number }>>({});
  const [state, action] = useActionState<ActionState, FormData>(createOrder, null);

  const warehouse = warehouses.find((w) => w.id === warehouseId)!;

  // La misma cotización que después congela el servidor. Se muestra en vivo
  // para que la PyME sepa el costo antes de confirmar.
  const quote = useMemo(
    () => (comuna ? quoteDeliveryToComuna({ lat: warehouse.lat, lng: warehouse.lng }, comuna) : null),
    [comuna, warehouse],
  );

  const items = Object.entries(lines)
    .filter(([, l]) => l.qty > 0)
    .map(([productId, l]) => ({ productId, qty: l.qty, unitPrice: l.unitPrice }));

  const itemsTotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const shipping = method === 'buyer_pickup' ? 0 : (quote?.buyerFee ?? 0);
  const unreachable = method === 'bodgo_courier' && comuna !== '' && quote === null;

  function setLine(id: string, patch: Partial<{ qty: number; unitPrice: number }>) {
    setLines((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { qty: 0, unitPrice: 0 }), ...patch },
    }));
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <input type="hidden" name="deliveryMethod" value={method} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      {/* -------------------------------------------------------- origen */}
      <fieldset className="card p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">Bodega de origen</legend>
        <p className="mt-1 text-[13px] text-ink-500">Sólo aparecen las bodegas donde tienes stock.</p>

        <ul className="mt-4 space-y-2">
          {warehouses.map((w) => (
            <li key={w.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-field border p-3.5 transition-colors ${
                  warehouseId === w.id ? 'border-navy-800 bg-brand-50/50' : 'border-line-200 hover:border-line-300'
                }`}
              >
                <input
                  type="radio"
                  name="origin"
                  checked={warehouseId === w.id}
                  onChange={() => {
                    setWarehouseId(w.id);
                    setLines({});
                  }}
                  className="h-4 w-4 accent-navy-800"
                />
                <span className="flex-1">
                  <span className="block text-[14px] font-extrabold text-navy-900">{w.comuna}</span>
                  <span className="block text-[12px] text-ink-400">
                    {w.items.length} {w.items.length === 1 ? 'producto disponible' : 'productos disponibles'}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* ------------------------------------------------------ productos */}
      <fieldset className="card p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">Qué se vendió</legend>

        <ul className="mt-4 divide-y divide-line-100">
          {warehouse.items.map((item) => {
            const line = lines[item.id] ?? { qty: 0, unitPrice: 0 };
            return (
              <li key={item.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-navy-900">{item.name}</p>
                    <p className="text-[11.5px] text-ink-400">
                      {item.sku} · {formatNumber(item.stock)} en bodega
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`qty-${item.id}`}>
                      Unidades de {item.name}
                    </label>
                    <input
                      id={`qty-${item.id}`}
                      type="number"
                      min={0}
                      max={item.stock}
                      value={line.qty}
                      onChange={(e) =>
                        setLine(item.id, { qty: Math.min(item.stock, Math.max(0, Number(e.target.value))) })
                      }
                      className="h-9 w-16 rounded-[10px] border border-line-200 text-center text-[13.5px] font-bold text-navy-900 tabular-nums"
                    />
                    <label className="sr-only" htmlFor={`price-${item.id}`}>
                      Precio unitario de {item.name}
                    </label>
                    <input
                      id={`price-${item.id}`}
                      type="number"
                      min={0}
                      step={10}
                      placeholder="Precio"
                      value={line.unitPrice || ''}
                      onChange={(e) => setLine(item.id, { unitPrice: Math.max(0, Number(e.target.value)) })}
                      className="h-9 w-24 rounded-[10px] border border-line-200 px-2 text-right text-[13.5px] font-bold text-navy-900 tabular-nums"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* -------------------------------------------------------- destino */}
      <fieldset className="card space-y-4 p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">Datos de entrega</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del comprador" htmlFor="buyerName">
            <Input id="buyerName" name="buyerName" required placeholder="Javiera Muñoz" />
          </Field>
          <Field label="Teléfono" htmlFor="buyerPhone">
            <Input id="buyerPhone" name="buyerPhone" placeholder="+56 9 6712 4408" />
          </Field>
        </div>

        <Field label="Dirección de entrega" htmlFor="buyerAddress">
          <Input id="buyerAddress" name="buyerAddress" required placeholder="Av. Pajaritos 2900, depto 12" />
        </Field>

        <Field label="Comuna" htmlFor="buyerComuna">
          <Select
            id="buyerComuna"
            name="buyerComuna"
            required
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
          >
            <option value="">Elige la comuna</option>
            {COMUNAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notas para la entrega (opcional)" htmlFor="deliveryNotes">
          <Textarea id="deliveryNotes" name="deliveryNotes" rows={2} placeholder="Dejar en conserjería si no hay nadie." />
        </Field>
      </fieldset>

      {/* --------------------------------------------------- método de envío */}
      <fieldset className="card p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">Método de envío</legend>

        <div className="mt-4 space-y-2">
          <MethodCard
            active={method === 'bodgo_courier'}
            title="Repartidor BodGo"
            body={
              !comuna
                ? 'Elige la comuna para ver la tarifa.'
                : quote
                  ? `${formatNumber(quote.distanceKm, 1)} km · Zona ${quote.zone} · llega en ~${quote.etaMinutes} min`
                  : `Todavía no llegamos a ${comuna} con repartidor propio.`
            }
            price={quote && comuna ? formatCLP(quote.buyerFee) : undefined}
            disabled={unreachable}
            onClick={() => setMethod('bodgo_courier')}
          />
          <MethodCard
            active={method === 'external_courier'}
            title="App de delivery externa"
            body="Uber, PedidosYa u otro courier que contrates tú."
            price={quote && comuna ? formatCLP(quote.buyerFee) : undefined}
            onClick={() => setMethod('external_courier')}
          />
          <MethodCard
            active={method === 'buyer_pickup'}
            title="Retiro por el comprador"
            body="El comprador pasa por la bodega. Sin costo de envío."
            price={formatCLP(0)}
            onClick={() => setMethod('buyer_pickup')}
          />
        </div>
      </fieldset>

      {/* -------------------------------------------------------- resumen */}
      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Resumen</h2>
        <dl className="mt-4 space-y-2.5 text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-ink-500">
              Venta · {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </dt>
            <dd className="font-bold text-navy-900 tabular-nums">{formatCLP(itemsTotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Envío</dt>
            <dd className="font-bold text-navy-900 tabular-nums">{formatCLP(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-line-200 pt-2.5">
            <dt className="font-extrabold text-navy-900">Total al comprador</dt>
            <dd className="text-[17px] font-extrabold text-navy-900 tabular-nums">
              {formatCLP(itemsTotal + shipping)}
            </dd>
          </div>
        </dl>

        {method === 'bodgo_courier' && quote ? (
          <p className="mt-4 rounded-field bg-brand-50 p-3.5 text-[12.5px] leading-relaxed text-navy-800">
            🛵 Cuando el bodeguero deje el pedido listo, el viaje se ofrece a los repartidores en
            línea. El repartidor recibe {formatCLP(quote.courierFee)} y BodGo retiene{' '}
            {formatCLP(quote.commission)}.
          </p>
        ) : null}
      </section>

      <div className="space-y-3">
        <FormError>{state?.error}</FormError>
        <Submit disabled={items.length === 0 || !comuna || unreachable} />
      </div>
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" size="lg" full disabled={pending || disabled}>
        {pending ? 'Creando el pedido…' : 'Crear pedido'}
      </Button>
      {disabled ? (
        <p className="text-center text-[12.5px] text-ink-400">
          Agrega al menos un producto y elige la comuna de entrega.
        </p>
      ) : null}
    </>
  );
}

function MethodCard({
  active,
  title,
  body,
  price,
  disabled,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  price?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-field border p-3.5 text-left transition-colors ${
        active ? 'border-navy-800 bg-brand-50/50' : 'border-line-200 hover:border-line-300'
      } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-200`}
    >
      <span className="flex-1">
        <span className="block text-[13.5px] font-extrabold text-navy-900">{title}</span>
        <span className="mt-0.5 block text-[11.5px] text-ink-400">{body}</span>
      </span>
      {price ? (
        <span className="text-[14px] font-extrabold text-navy-900 tabular-nums">{price}</span>
      ) : null}
    </button>
  );
}
