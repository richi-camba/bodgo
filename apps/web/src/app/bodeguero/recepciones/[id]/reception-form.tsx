'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { confirmReception, type ActionState } from '@/app/bodeguero/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { PhotoCapture } from '@/components/app/photo-capture';
import { StickyBar } from '@/components/app/step-header';
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
 * Cada línea se marca al contarla: el tilde confirma que llegó completa,
 * «Está mal» abre el contador. Lo que no se toca se da por recibido tal como
 * se declaró, así que se puede confirmar sin tildar nada — pero el tilde deja
 * ver por dónde iba quien está con la pila de cajas al lado.
 */
export function ReceptionForm({
  shipmentId,
  code,
  declaredVolumeM3,
  capacityM3,
  items,
}: {
  shipmentId: string;
  code: string;
  declaredVolumeM3: number;
  capacityM3: number;
  items: Line[];
}) {
  const [contadas, setContadas] = useState<Record<string, 'ok' | 'mal'>>({});
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

  const revisadas = Object.keys(contadas).length;

  function marcar(productId: string, como: 'ok' | 'mal', declared: number) {
    setContadas((c) => ({ ...c, [productId]: como }));
    setCorrections((c) => {
      const next = { ...c };
      if (como === 'ok') delete next[productId];
      else next[productId] = next[productId] ?? declared;
      return next;
    });
  }

  return (
    <form action={action} className="space-y-4 pb-28">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="counts" value={JSON.stringify(counts)} />
      <input type="hidden" name="receivedVolumeM3" value={volume} />

      <p className="flex gap-2.5 rounded-[13px] bg-brand-50 p-3.5 text-[12.5px] leading-relaxed text-navy-800">
        <span className="mt-0.5 shrink-0 text-brand-600">
          <Icon name="verificado" size={17} />
        </span>
        Cuenta cada producto y márcalo. Si no coincide, indica cuánto llegó realmente: la PyME
        recibe el aviso al instante.
      </p>

      {/* ------------------------------------------------------- volumen */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-extrabold text-navy-900">Volumen declarado</h2>
          {/* El badge sale del número medido, no de un botón: si lo que llegó
              excede el espacio, es un hecho, no una opinión del bodeguero. */}
          <span
            className={`rounded-[7px] px-2.5 py-1 text-[11px] font-bold ${
              result.capacity.exceeds ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'
            }`}
          >
            {result.capacity.exceeds ? 'Excede el espacio' : 'Dentro del espacio'}
          </span>
        </div>

        <div className="flex gap-2.5">
          <Caja rotulo="Declarado" valor={`${formatNumber(declaredVolumeM3, 2)} m³`} />
          <Caja rotulo="Capacidad del espacio" valor={`${formatNumber(capacityM3, 1)} m³`} />
        </div>

        <div className="mt-4">
          <Field
            label="Volumen medido (m³)"
            htmlFor="volume"
            hint="Ajusta si lo que llegó ocupa más o menos de lo declarado."
          >
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

        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink-500">Ocupación de la capacidad</span>
            <span
              className={`font-extrabold ${result.capacity.exceeds ? 'text-danger-700' : 'text-navy-900'}`}
            >
              {result.capacity.percentUsed}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.min(100, result.capacity.percentUsed)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Ocupación de la capacidad contratada"
            className="mt-1.5 h-2 overflow-hidden rounded-pill bg-line-100"
          >
            <div
              className={`h-full rounded-pill ${result.capacity.exceeds ? 'bg-danger-600' : 'bg-success-600'}`}
              style={{ width: `${Math.min(100, result.capacity.percentUsed)}%` }}
            />
          </div>
        </div>

        {result.capacity.exceeds ? (
          <p className="mt-3.5 rounded-[12px] bg-danger-50 p-3 text-[12px] leading-relaxed text-danger-700">
            Excede en {formatNumber(result.capacity.excessM3, 2)} m³ lo contratado. Al confirmar se
            abre una discrepancia de volumen: corresponde ampliar el contrato o retirar el
            excedente.
          </p>
        ) : null}
      </section>

      {/* --------------------------------------------------------- conteo */}
      <section>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wide text-ink-500">
            Declarado en el envío {code}
          </h2>
          <span className="shrink-0 text-[11.5px] text-ink-500 tabular-nums">
            {revisadas} de {items.length} contados
          </span>
        </div>

        <ul className="space-y-2.5">
          {items.map((item) => {
            const marca = contadas[item.productId];
            const received = corrections[item.productId] ?? item.declared;
            const gap = received - item.declared;

            return (
              <li
                key={item.productId}
                className={`rounded-[15px] bg-white p-3.5 ${
                  marca === 'mal'
                    ? 'border-[1.5px] border-danger-600/40'
                    : marca === 'ok'
                      ? 'border-[1.5px] border-success-600/50'
                      : 'border-[1.5px] border-line-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-navy-900">{item.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-500">
                      {item.sku}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                    <p className="mt-1.5 text-[12.5px] font-bold text-navy-800">
                      Declarado: {formatNumber(item.declared)} u
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={marca === 'ok'}
                      aria-label={`${item.name}: llegó completo`}
                      onClick={() => marcar(item.productId, 'ok', item.declared)}
                      className={`flex h-9 w-9 items-center justify-center rounded-[10px] border-2 transition-colors ${
                        marca === 'ok'
                          ? 'border-success-600 bg-success-600 text-white'
                          : 'border-line-300 bg-white text-line-300 hover:border-success-600 hover:text-success-600'
                      }`}
                    >
                      <Icon name="listo" size={17} />
                    </button>

                    <button
                      type="button"
                      aria-pressed={marca === 'mal'}
                      onClick={() => marcar(item.productId, 'mal', item.declared)}
                      className={`rounded-[10px] px-3 py-2 text-[12px] font-bold transition-colors ${
                        marca === 'mal'
                          ? 'bg-danger-700 text-white'
                          : 'bg-surface-100 text-ink-700 hover:bg-line-100'
                      }`}
                    >
                      Está mal
                    </button>
                  </div>
                </div>

                {marca === 'mal' ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-[12px] bg-danger-50 p-3">
                    <div className="min-w-0">
                      <label
                        htmlFor={`count-${item.productId}`}
                        className="block text-[12px] font-bold text-navy-900"
                      >
                        Conteo real
                      </label>
                      <p
                        className={`mt-0.5 text-[11.5px] font-bold ${
                          gap === 0 ? 'text-ink-500' : gap < 0 ? 'text-danger-700' : 'text-warning-700'
                        }`}
                      >
                        {gap === 0
                          ? 'igual a lo declarado'
                          : gap < 0
                            ? `${-gap} de menos`
                            : `+${gap} de más`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Mini
                        label={`Restar una unidad de ${item.name}`}
                        onClick={() =>
                          setCorrections((c) => ({
                            ...c,
                            [item.productId]: Math.max(0, (c[item.productId] ?? item.declared) - 1),
                          }))
                        }
                        disabled={received <= 0}
                      >
                        −
                      </Mini>
                      <input
                        id={`count-${item.productId}`}
                        type="number"
                        min={0}
                        value={received}
                        onChange={(e) =>
                          setCorrections((c) => ({
                            ...c,
                            [item.productId]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="h-[30px] w-14 rounded-[9px] border border-line-200 bg-white text-center text-[15px] font-extrabold text-navy-800 tabular-nums"
                      />
                      <Mini
                        label={`Sumar una unidad de ${item.name}`}
                        onClick={() =>
                          setCorrections((c) => ({
                            ...c,
                            [item.productId]: (c[item.productId] ?? item.declared) + 1,
                          }))
                        }
                      >
                        +
                      </Mini>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {/* -------------------------------------------------------- resultado */}
      {result.hasDiscrepancy ? (
        <section className="rounded-[16px] border-[1.5px] border-danger-600/25 bg-white p-4">
          <h2 className="text-[13.5px] font-extrabold text-danger-700">
            {result.mismatchCount > 0
              ? `${result.mismatchCount} ${result.mismatchCount === 1 ? 'producto no coincide' : 'productos no coinciden'}`
              : 'El volumen excede lo contratado'}
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
            Al confirmar se abre una discrepancia, se avisa a la PyME y el pago sigue retenido en
            custodia hasta resolverla.
            {result.unitsShort > 0 ? ` ${unidades('Falta', result.unitsShort)}.` : ''}
            {result.unitsOver > 0 ? ` ${unidades('Sobra', result.unitsOver)}.` : ''}
          </p>
        </section>
      ) : (
        <section className="flex items-center gap-2.5 rounded-[14px] bg-success-50 p-3.5">
          <span className="shrink-0 text-success-700">
            <Icon name="listo" size={20} />
          </span>
          <div>
            <p className="text-[13.5px] font-extrabold text-success-700">
              Todo coincide con el manifiesto
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-700">
              {formatNumber(result.receivedUnits)} unidades · al confirmar se libera el pago para tu
              liquidación
            </p>
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- respaldo */}
      <section className="card space-y-4 p-4">
        <PhotoCapture
          name="photoPath"
          folder="recepciones"
          label="Foto de lo recibido"
          hint="Los bultos abiertos, con las etiquetas a la vista"
        />

        <Field
          label={
            result.hasDiscrepancy ? 'Nota para la PyME' : 'Nota para la PyME (opcional)'
          }
          htmlFor="note"
        >
          <Textarea
            id="note"
            name="note"
            rows={2}
            placeholder="Ej: un bulto llegó con la cinta cortada"
          />
        </Field>

        <FormError>{state?.error}</FormError>
      </section>

      <StickyBar>
        <Confirmar hasDiscrepancy={result.hasDiscrepancy} />
      </StickyBar>
    </form>
  );
}

/** «Falta 1 unidad» / «Faltan 3 unidades»: el plural mal puesto se nota. */
function unidades(verbo: 'Falta' | 'Sobra', n: number) {
  return n === 1 ? `${verbo} 1 unidad` : `${verbo}n ${formatNumber(n)} unidades`;
}

function Confirmar({ hasDiscrepancy }: { hasDiscrepancy: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full variant={hasDiscrepancy ? 'danger' : 'primary'} disabled={pending}>
      {pending ? 'Registrando…' : hasDiscrepancy ? 'Confirmar con diferencia' : 'Confirmar recepción'}
    </Button>
  );
}

function Caja({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex-1 rounded-[12px] bg-surface-25 p-3">
      <p className="text-[11px] font-semibold text-ink-500">{rotulo}</p>
      <p className="mt-1 text-[19px] font-extrabold text-navy-800 tabular-nums">{valor}</p>
    </div>
  );
}

function Mini({
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
      className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border border-line-200 bg-white text-[17px] font-bold text-navy-800 transition-colors hover:border-navy-800 disabled:text-ink-400 disabled:hover:border-line-200"
    >
      {children}
    </button>
  );
}
