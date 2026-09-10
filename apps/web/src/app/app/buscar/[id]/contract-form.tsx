'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { createContract, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { formatCLP, formatNumber, quoteContract, usableCapacityM3 } from '@bodgo/core';

type Card = { id: string; brand: string; last4: string; is_default: boolean };

export function ContractForm({
  warehouseId,
  comuna,
  pricePerM2,
  availableM2,
  cards,
}: {
  warehouseId: string;
  comuna: string;
  pricePerM2: number;
  availableM2: number;
  cards: Card[];
}) {
  const maxM2 = Math.max(1, Math.floor(availableM2));
  const [m2, setM2] = useState(() => Math.min(4, maxM2));
  const [cardId, setCardId] = useState(cards.find((c) => c.is_default)?.id ?? cards[0]?.id ?? '');
  const [state, action] = useActionState<ActionState, FormData>(createContract, null);

  const quote = quoteContract(m2, pricePerM2);

  if (availableM2 < 1) {
    return (
      <section className="card p-6">
        <h2 className="text-[16px] font-extrabold text-navy-900">Sin espacio disponible</h2>
        <p className="mt-2 text-[13.5px] text-ink-500">
          Esta microbodega está completa por ahora. Prueba con otra de la red.
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="card p-6">
      <h2 className="text-[16px] font-extrabold text-navy-900">Contratar en {comuna}</h2>
      <p className="mt-1 text-[13px] text-ink-500">
        Quedan {formatNumber(availableM2, 1)} m² · {formatCLP(pricePerM2)} por m² al mes.
      </p>

      <input type="hidden" name="warehouseId" value={warehouseId} />
      <input type="hidden" name="m2" value={m2} />
      <input type="hidden" name="paymentMethodId" value={cardId} />

      {/* --------------------------------------------------- superficie */}
      <fieldset className="mt-6">
        <legend className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
          Metros cuadrados
        </legend>

        <div className="mt-3 flex items-center gap-4">
          <Stepper label="Quitar un metro cuadrado" onClick={() => setM2((v) => Math.max(1, v - 1))} disabled={m2 <= 1}>
            −
          </Stepper>

          <p className="flex-1 text-center">
            <span className="text-[34px] font-extrabold leading-none text-navy-900 tabular-nums">{m2}</span>
            <span className="ml-1 text-[15px] font-bold text-ink-400">m²</span>
          </p>

          <Stepper
            label="Agregar un metro cuadrado"
            onClick={() => setM2((v) => Math.min(maxM2, v + 1))}
            disabled={m2 >= maxM2}
          >
            +
          </Stepper>
        </div>

        <p className="mt-3 text-center text-[12.5px] text-ink-400">
          Equivale a {formatNumber(usableCapacityM3(m2), 1)} m³ apilables · máximo {maxM2} m²
        </p>
      </fieldset>

      {/* ------------------------------------------------------ resumen */}
      <dl className="mt-6 space-y-2.5 rounded-field bg-surface-50 p-4 text-[13.5px]">
        <Line label={`${m2} m² × ${formatCLP(pricePerM2)}`} value={formatCLP(quote.base)} />
        <Line label="Comisión plataforma (8%)" value={formatCLP(quote.commission)} />
        <div className="flex items-center justify-between border-t border-line-200 pt-2.5">
          <dt className="font-extrabold text-navy-900">Total mensual</dt>
          <dd className="text-[17px] font-extrabold text-navy-900 tabular-nums">{formatCLP(quote.total)}</dd>
        </div>
      </dl>

      {/* ------------------------------------------------- medio de pago */}
      <fieldset className="mt-6">
        <legend className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
          Medio de pago
        </legend>

        {cards.length === 0 ? (
          <p className="mt-3 rounded-field bg-warning-50 p-4 text-[13px] text-warning-700">
            Todavía no tienes una tarjeta guardada.{' '}
            <Link href="/app/perfil" className="font-bold underline">
              Agrega una
            </Link>{' '}
            para poder contratar.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {cards.map((card) => (
              <li key={card.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-field border p-3.5 transition-colors ${
                    cardId === card.id ? 'border-navy-800 bg-brand-50/50' : 'border-line-200 hover:border-line-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="card"
                    checked={cardId === card.id}
                    onChange={() => setCardId(card.id)}
                    className="h-4 w-4 accent-navy-800"
                  />
                  <span className="flex-1 text-[13.5px] font-bold text-navy-900">
                    {card.brand} •••• {card.last4}
                  </span>
                  {card.is_default ? (
                    <span className="text-[11px] font-bold text-ink-400">Principal</span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div className="mt-5 space-y-3">
        <FormError>{state?.error}</FormError>

        <p className="text-[12.5px] leading-relaxed text-ink-500">
          Se te cobra por adelantado y BodGo mantiene el monto en custodia. Al bodeguero se le paga a
          fin de mes. El cobro se repite cada mes hasta que canceles.
        </p>

        <Submit total={quote.total} disabled={!cardId} />
      </div>
    </form>
  );
}

function Submit({ total, disabled }: { total: number; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending || disabled}>
      {pending ? 'Procesando el pago…' : `Confirmar y pagar ${formatCLP(total)}`}
    </Button>
  );
}

function Stepper({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-field border border-line-200 text-[20px] font-bold text-navy-800 transition-colors hover:border-navy-800 disabled:text-line-300 disabled:hover:border-line-200"
    >
      {children}
    </button>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-bold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
