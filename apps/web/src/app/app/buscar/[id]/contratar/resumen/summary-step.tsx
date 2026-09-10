'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createContract, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { StickyBar } from '@/components/app/step-header';
import { formatCLP, formatNumber, quoteContract } from '@bodgo/core';

type Card = {
  id: string;
  brand: string;
  last4: string;
  holder_name: string | null;
  is_default: boolean;
};

/** Colores de marca de las tarjetas, para el chip del selector. */
const MARCA: Record<string, string> = {
  Visa: 'bg-navy-800 text-white',
  Mastercard: 'bg-warning-700 text-white',
};

export function SummaryStep({
  warehouseId,
  comuna,
  bodeguero,
  photo,
  m2,
  pricePerM2,
  cards,
}: {
  warehouseId: string;
  comuna: string;
  bodeguero: string;
  photo: string | null;
  m2: number;
  pricePerM2: number;
  cards: Card[];
}) {
  const [cardId, setCardId] = useState(cards.find((c) => c.is_default)?.id ?? cards[0]?.id ?? '');
  const [state, action] = useActionState<ActionState, FormData>(createContract, null);

  const quote = quoteContract(m2, pricePerM2);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <input type="hidden" name="m2" value={m2} />
      <input type="hidden" name="paymentMethodId" value={cardId} />

      {/* ------------------------------------------------ bodega elegida */}
      <div className="flex items-center gap-3 rounded-[16px] bg-white p-3">
        {/* Sin foto va el rayado del prototipo: se lee como «acá falta una
            imagen» y no compite con el nombre de la comuna. */}
        <span className="relative block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-rayado">
          {photo ? <Image src={photo} alt="" fill sizes="52px" className="object-cover" /> : null}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-navy-900">{comuna}</p>
          <p className="text-[12.5px] text-ink-500">
            {formatNumber(m2, 0)} m² · {bodeguero}
          </p>
        </div>
      </div>

      {/* --------------------------------------------------- desglose */}
      <dl className="space-y-2.5 rounded-[16px] bg-white p-4 text-[13.5px]">
        <Linea label={`${m2} m² × ${formatCLP(pricePerM2)}`} valor={formatCLP(quote.base)} />
        <Linea label="Comisión plataforma (8%)" valor={formatCLP(quote.commission)} />
        <div className="flex items-center justify-between border-t border-line-100 pt-2.5">
          <dt className="text-[15px] font-extrabold text-navy-900">Total mensual</dt>
          <dd className="text-[20px] font-extrabold text-navy-900 tabular-nums">
            {formatCLP(quote.total)}
          </dd>
        </div>
      </dl>

      {/* ----------------------------------------------- medio de pago */}
      <fieldset>
        <legend className="mb-2 text-[13.5px] font-bold text-navy-900">Medio de pago</legend>

        {cards.length === 0 ? (
          <p className="rounded-[14px] bg-warning-50 p-4 text-[13px] text-warning-700">
            Todavía no tienes una tarjeta guardada.{' '}
            <Link href="/app/perfil" className="font-bold underline">
              Agrega una
            </Link>{' '}
            para poder contratar.
          </p>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => {
              const elegida = cardId === card.id;
              return (
                <li key={card.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-[14px] border-2 bg-white p-3.5 transition-colors ${
                      elegida ? 'border-navy-800' : 'border-line-200 hover:border-line-300'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-7 w-10 shrink-0 items-center justify-center rounded-[6px] text-[9px] font-extrabold uppercase ${
                        MARCA[card.brand] ?? 'bg-surface-100 text-ink-700'
                      }`}
                    >
                      {card.brand.slice(0, 4)}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold text-navy-900">
                        •••• {card.last4}
                      </span>
                      <span className="block text-[11.5px] text-ink-500">
                        {card.holder_name ?? card.brand}
                      </span>
                    </span>

                    <input
                      type="radio"
                      name="card"
                      checked={elegida}
                      onChange={() => setCardId(card.id)}
                      className="h-4.5 w-4.5 accent-navy-800"
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
          <Icon name="recurrente" size={13} />
          Se cobrará automáticamente cada mes hasta que canceles.
        </p>
      </fieldset>

      <div className="flex gap-3 rounded-[14px] bg-brand-50 p-4">
        <span className="mt-0.5 shrink-0 text-brand-600">
          <Icon name="seguro" size={16} />
        </span>
        <p className="text-[12.5px] leading-relaxed text-navy-800">
          Se te cobra <strong className="font-bold">por adelantado</strong> y BodGo mantiene el
          monto <strong className="font-bold">en custodia</strong>. Al bodeguero se le paga{' '}
          <strong className="font-bold">a fin de mes</strong>.
        </p>
      </div>

      <FormError>{state?.error}</FormError>

      <StickyBar etiqueta="Total" valor={formatCLP(quote.total)}>
        <Confirmar disabled={!cardId} />
      </StickyBar>
    </form>
  );
}

function Confirmar({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      full
      disabled={pending || disabled}
      className="bg-brand-600 hover:bg-brand-700"
    >
      {pending ? 'Procesando el pago…' : 'Confirmar y pagar'}
    </Button>
  );
}

function Linea({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-bold text-navy-900 tabular-nums">{valor}</dd>
    </div>
  );
}
