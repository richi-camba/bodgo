'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createShipment, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/field';
import { checkCapacityM3, formatNumber, shipmentVolumeM3 } from '@bodgo/core';

type Contract = {
  id: string;
  warehouseId: string;
  comuna: string;
  sector: string;
  m2: number;
  capacityM3: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unitVolumeM3: number;
};

export function ShipmentBuilder({
  contracts,
  products,
  defaultPickupAddress,
}: {
  contracts: Contract[];
  products: Product[];
  defaultPickupAddress: string;
}) {
  const [contractId, setContractId] = useState(contracts[0]!.id);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<'own' | 'external_courier'>('own');
  const [state, action] = useActionState<ActionState, FormData>(createShipment, null);

  const contract = contracts.find((c) => c.id === contractId)!;

  const items = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => ({ productId, qty })),
    [quantities],
  );

  const volume = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return shipmentVolumeM3(
      items.map((i) => ({ unitVolumeM3: byId.get(i.productId)?.unitVolumeM3 ?? 0, quantity: i.qty })),
    );
  }, [items, products]);

  const capacity = checkCapacityM3(volume, contract.capacityM3);
  const unitTotal = items.reduce((s, i) => s + i.qty, 0);

  function setQty(id: string, value: number) {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, value) }));
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="warehouseId" value={contract.warehouseId} />
      <input type="hidden" name="contractId" value={contract.id} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="method" value={method} />

      {/* ------------------------------------------------------- destino */}
      <fieldset className="card p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">¿A qué bodega envías?</legend>
        <p className="mt-1 text-[13px] text-ink-500">Selecciona una de tus bodegas contratadas.</p>

        <ul className="mt-4 space-y-2">
          {contracts.map((c) => (
            <li key={c.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-field border p-3.5 transition-colors ${
                  contractId === c.id ? 'border-navy-800 bg-brand-50/50' : 'border-line-200 hover:border-line-300'
                }`}
              >
                <input
                  type="radio"
                  name="destination"
                  checked={contractId === c.id}
                  onChange={() => setContractId(c.id)}
                  className="h-4 w-4 accent-navy-800"
                />
                <span className="flex-1">
                  <span className="block text-[14px] font-extrabold text-navy-900">{c.comuna}</span>
                  <span className="block text-[12px] text-ink-400">
                    {formatNumber(c.m2, 1)} m² · {formatNumber(c.capacityM3, 1)} m³ apilables
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* ---------------------------------------------------- manifiesto */}
      <fieldset className="card p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">Detalle de inventario</legend>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
          Marca qué productos van en este envío y cuántas unidades. El bodeguero verifica contra esta
          lista al recibir.
        </p>

        <ul className="mt-4 divide-y divide-line-100">
          {products.map((p) => {
            const qty = quantities[p.id] ?? 0;
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-navy-900">{p.name}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {p.sku}
                    {p.category ? ` · ${p.category}` : ''} · {formatNumber(p.unitVolumeM3 * 1000, 1)} L c/u
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <StepButton label={`Quitar una unidad de ${p.name}`} onClick={() => setQty(p.id, qty - 1)} disabled={qty <= 0}>
                    −
                  </StepButton>
                  <label className="sr-only" htmlFor={`qty-${p.id}`}>
                    Unidades de {p.name}
                  </label>
                  <input
                    id={`qty-${p.id}`}
                    type="number"
                    min={0}
                    value={qty}
                    onChange={(e) => setQty(p.id, Number(e.target.value))}
                    className="h-9 w-16 rounded-[10px] border border-line-200 text-center text-[13.5px] font-bold text-navy-900 tabular-nums"
                  />
                  <StepButton label={`Agregar una unidad de ${p.name}`} onClick={() => setQty(p.id, qty + 1)}>
                    +
                  </StepButton>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* -------------------------------------------------------- volumen */}
      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Volumen del envío</h2>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-field bg-surface-50 p-3">
            <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">Volumen total</dt>
            <dd className="mt-1 text-[16px] font-extrabold text-navy-900 tabular-nums">
              {formatNumber(volume, 2)} m³
            </dd>
          </div>
          <div className="rounded-field bg-surface-50 p-3">
            <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">Capacidad contratada</dt>
            <dd className="mt-1 text-[16px] font-extrabold text-navy-900 tabular-nums">
              {formatNumber(capacity.capacityM3, 1)} m³
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[12px] font-semibold">
            <span className="text-ink-500">
              Ocupa de tu capacidad ({formatNumber(contract.m2, 1)} m²)
            </span>
            <span className={capacity.exceeds ? 'text-danger-600' : 'text-navy-900'}>
              {capacity.percentUsed}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.min(100, capacity.percentUsed)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Ocupación de la capacidad contratada"
            className="mt-1.5 h-2 overflow-hidden rounded-pill bg-line-100"
          >
            <div
              className={`h-full rounded-pill transition-[width] ${
                capacity.exceeds ? 'bg-danger-600' : 'bg-success-600'
              }`}
              style={{ width: `${Math.min(100, capacity.percentUsed)}%` }}
            />
          </div>
        </div>

        {capacity.exceeds ? (
          <p className="mt-4 rounded-field bg-danger-50 p-3.5 text-[12.5px] leading-relaxed text-danger-600">
            Excedes tu capacidad en {formatNumber(capacity.excessM3, 2)} m³. Puedes ampliar el
            contrato o dividir el envío; si llega así, el bodeguero puede rechazar el excedente y se
            abre una discrepancia.
          </p>
        ) : items.length > 0 ? (
          <p className="mt-4 rounded-field bg-success-50 p-3.5 text-[12.5px] font-semibold text-success-700">
            Cabe en tu espacio contratado.
          </p>
        ) : null}

        <p className="mt-4 border-t border-line-100 pt-3 text-[12.5px] text-ink-500">
          {items.length} {items.length === 1 ? 'producto seleccionado' : 'productos seleccionados'} ·{' '}
          <strong className="font-bold text-navy-900">{formatNumber(unitTotal)} unidades</strong>
        </p>
      </section>

      {/* -------------------------------------------------------- logística */}
      <fieldset className="card space-y-4 p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">Detalle del despacho</legend>

        <Field label="Descripción" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            required
            rows={2}
            placeholder="Ropa de temporada — cajas surtidas"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="N° de bultos" htmlFor="packagesCount">
            <Input id="packagesCount" name="packagesCount" type="number" min={1} required defaultValue={1} />
          </Field>
          <Field label="Peso aproximado (kg)" htmlFor="weightKg">
            <Input id="weightKg" name="weightKg" type="number" min={0} step="0.1" placeholder="18" />
          </Field>
        </div>

        <Field label="Dirección de retiro" htmlFor="pickupAddress">
          <Input id="pickupAddress" name="pickupAddress" defaultValue={defaultPickupAddress} placeholder="Av. Providencia 1550, of. 402" />
        </Field>

        <div>
          <p className="mb-2 text-[12.5px] font-bold text-ink-700">¿Cómo llevas la mercadería?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <MethodCard
              active={method === 'own'}
              title="Envío propio"
              body="Tú o tu conductor la lleva"
              onClick={() => setMethod('own')}
            />
            <MethodCard
              active={method === 'external_courier'}
              title="App de delivery externa"
              body="Uber, PedidosYa u otro courier"
              onClick={() => setMethod('external_courier')}
            />
          </div>
        </div>
      </fieldset>

      <div className="space-y-3">
        <FormError>{state?.error}</FormError>

        <p className="rounded-field bg-brand-50 p-3.5 text-[12.5px] leading-relaxed text-navy-800">
          📦 Etiqueta cada bulto con el código del envío que generaremos. Fotografía los bultos antes
          de despachar: es tu respaldo si hay diferencias en la recepción.
        </p>

        <Submit disabled={items.length === 0} />
      </div>
    </form>
  );
}

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" size="lg" full disabled={pending || disabled}>
        {pending ? 'Creando el envío…' : 'Crear envío'}
      </Button>
      {disabled ? (
        <p className="text-center text-[12.5px] text-ink-400">
          Selecciona al menos un producto para continuar.
        </p>
      ) : null}
    </>
  );
}

function StepButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line-200 text-[17px] font-bold text-navy-800 transition-colors hover:border-navy-800 disabled:text-line-300 disabled:hover:border-line-200"
    >
      {children}
    </button>
  );
}

function MethodCard({
  active,
  title,
  body,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-field border p-3.5 text-left transition-colors ${
        active ? 'border-navy-800 bg-brand-50/50' : 'border-line-200 hover:border-line-300'
      }`}
    >
      <span className="block text-[13.5px] font-extrabold text-navy-900">{title}</span>
      <span className="mt-0.5 block text-[11.5px] text-ink-400">{body}</span>
    </button>
  );
}
