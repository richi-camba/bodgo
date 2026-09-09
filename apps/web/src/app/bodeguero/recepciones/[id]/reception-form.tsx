'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { confirmReception, type ActionState } from '@/app/bodeguero/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/field';
import { formatNumber, reconcileReception } from '@bodgo/core';

type Line = {
  productId: string;
  sku: string;
  name: string;
  category: string | null;
  declared: number;
};

/**
 * Conteo de recepción.
 *
 * El bodeguero sólo toca lo que NO calza: por omisión cada línea se da por
 * recibida completa. Es la manera rápida de trabajar con una pila de cajas al
 * lado, y hace que corregir sea un acto deliberado.
 */
export function ReceptionForm({
  shipmentId,
  declaredVolumeM3,
  capacityM3,
  items,
}: {
  shipmentId: string;
  declaredVolumeM3: number;
  capacityM3: number;
  items: Line[];
}) {
  const [corrections, setCorrections] = useState<Record<string, number>>({});
  const [volume, setVolume] = useState(declaredVolumeM3);
  const [state, action] = useActionState<ActionState, FormData>(confirmReception, null);

  // La conciliación se calcula acá con la misma función que corre después en
  // Postgres, así el bodeguero ve el resultado antes de confirmar.
  const result = useMemo(
    () =>
      reconcileReception(
        items.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          name: i.name,
          declared: i.declared,
          received: corrections[i.productId] ?? i.declared,
        })),
        volume,
        capacityM3,
      ),
    [items, corrections, volume, capacityM3],
  );

  const counts = Object.entries(corrections).map(([product_id, received]) => ({
    product_id,
    received,
  }));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="counts" value={JSON.stringify(counts)} />
      <input type="hidden" name="receivedVolumeM3" value={volume} />

      {/* ------------------------------------------------------- volumen */}
      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Volumen recibido</h2>
        <p className="mt-1 text-[12.5px] text-ink-500">
          Declarado {formatNumber(declaredVolumeM3, 2)} m³ contra {formatNumber(capacityM3, 1)} m³ de
          capacidad contratada.
        </p>

        <div className="mt-4">
          <Field label="Volumen medido (m³)" htmlFor="volume" hint="Ajusta si lo que llegó ocupa más o menos de lo declarado.">
            <Input
              id="volume"
              type="number"
              step="0.01"
              min="0"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[12px] font-semibold">
            <span className="text-ink-500">Ocupación de la capacidad</span>
            <span className={result.capacity.exceeds ? 'text-danger-600' : 'text-navy-900'}>
              {result.capacity.percentUsed}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-line-100">
            <div
              className={`h-full rounded-pill ${result.capacity.exceeds ? 'bg-danger-600' : 'bg-success-600'}`}
              style={{ width: `${Math.min(100, result.capacity.percentUsed)}%` }}
            />
          </div>
        </div>

        {result.capacity.exceeds ? (
          <p className="mt-4 rounded-field bg-danger-50 p-3.5 text-[12.5px] leading-relaxed text-danger-600">
            Excede en {formatNumber(result.capacity.excessM3, 2)} m³ lo contratado. Al confirmar se
            abre una discrepancia de volumen: corresponde ampliar el contrato o retirar el excedente.
          </p>
        ) : null}
      </section>

      {/* --------------------------------------------------------- conteo */}
      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Conteo contra el manifiesto</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
          Cada línea se da por recibida completa. Marca “Está mal” sólo en lo que no coincide e
          indica cuánto llegó realmente: la PyME recibe el aviso al instante.
        </p>

        <ul className="mt-4 divide-y divide-line-100">
          {items.map((item) => {
            const corrected = item.productId in corrections;
            const received = corrections[item.productId] ?? item.declared;
            const gap = received - item.declared;

            return (
              <li key={item.productId} className="py-3.5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-navy-900">{item.name}</p>
                    <p className="text-[11.5px] text-ink-400">
                      {item.sku}
                      {item.category ? ` · ${item.category}` : ''} · declarado {item.declared} u
                    </p>
                  </div>

                  {corrected ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCorrections((c) => {
                          const next = { ...c };
                          delete next[item.productId];
                          return next;
                        })
                      }
                      className="shrink-0 text-[12px] font-bold text-ink-400 hover:text-navy-800 hover:underline"
                    >
                      Coincide
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCorrections((c) => ({ ...c, [item.productId]: item.declared }))}
                      className="shrink-0 rounded-pill bg-surface-100 px-3 py-1.5 text-[12px] font-bold text-ink-700 hover:bg-line-100"
                    >
                      Está mal
                    </button>
                  )}
                </div>

                {corrected ? (
                  <div className="mt-3 flex items-center gap-3 rounded-field bg-surface-50 p-3">
                    <label htmlFor={`count-${item.productId}`} className="text-[12px] font-bold text-ink-700">
                      Conteo real
                    </label>
                    <input
                      id={`count-${item.productId}`}
                      type="number"
                      min={0}
                      value={received}
                      onChange={(e) =>
                        setCorrections((c) => ({ ...c, [item.productId]: Math.max(0, Number(e.target.value)) }))
                      }
                      className="h-9 w-20 rounded-[10px] border border-line-200 text-center text-[13.5px] font-bold text-navy-900 tabular-nums"
                    />
                    {gap !== 0 ? (
                      <span className={`text-[12px] font-bold ${gap < 0 ? 'text-danger-600' : 'text-warning-600'}`}>
                        {gap > 0 ? `+${gap} de más` : `${-gap} de menos`}
                      </span>
                    ) : (
                      <span className="text-[12px] font-bold text-ink-400">igual a lo declarado</span>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* -------------------------------------------------------- resultado */}
      <section
        className={`rounded-card border p-5 ${
          result.hasDiscrepancy
            ? 'border-danger-600/25 bg-danger-50'
            : 'border-success-600/25 bg-success-50'
        }`}
      >
        <h2
          className={`text-[15px] font-extrabold ${
            result.hasDiscrepancy ? 'text-danger-600' : 'text-success-700'
          }`}
        >
          {result.hasDiscrepancy
            ? `${result.mismatchCount > 0 ? `${result.mismatchCount} ${result.mismatchCount === 1 ? 'producto no coincide' : 'productos no coinciden'}` : 'El volumen excede lo contratado'}`
            : 'Todo coincide con el manifiesto'}
        </h2>

        <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
          {result.hasDiscrepancy ? (
            <>
              Al confirmar se abre una discrepancia, se avisa a la PyME y el pago sigue retenido en
              custodia hasta resolverla.
              {result.unitsShort > 0 ? ` Faltan ${result.unitsShort} unidades.` : ''}
              {result.unitsOver > 0 ? ` Sobran ${result.unitsOver} unidades.` : ''}
            </>
          ) : (
            <>
              Al confirmar, el stock entra al inventario de la PyME y se libera el pago para tu
              liquidación de fin de mes. {formatNumber(result.receivedUnits)} unidades en total.
            </>
          )}
        </p>
      </section>

      <div className="space-y-4">
        <Field label="Nota para la PyME (opcional)" htmlFor="note">
          <Textarea
            id="note"
            name="note"
            rows={2}
            placeholder="Una caja venía abierta, faltaban tres poleras."
          />
        </Field>

        <FormError>{state?.error}</FormError>

        <Submit hasDiscrepancy={result.hasDiscrepancy} />
      </div>
    </form>
  );
}

function Submit({ hasDiscrepancy }: { hasDiscrepancy: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      full
      variant={hasDiscrepancy ? 'danger' : 'success'}
      disabled={pending}
    >
      {pending
        ? 'Registrando…'
        : hasDiscrepancy
          ? 'Confirmar con diferencia'
          : 'Confirmar recepción'}
    </Button>
  );
}
