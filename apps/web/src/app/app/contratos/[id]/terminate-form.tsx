'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { terminateContract, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { calculateEarlyTermination, formatCLP } from '@bodgo/core';

export function TerminateForm({ contractId, baseAmount }: { contractId: string; baseAmount: number }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(15);
  const [state, action] = useActionState<ActionState, FormData>(terminateContract, null);

  const result = calculateEarlyTermination(baseAmount, days);

  if (!open) {
    return (
      <section className="card p-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[13.5px] font-bold text-danger-700 hover:underline"
        >
          Terminar contrato anticipadamente
        </button>
      </section>
    );
  }

  return (
    <form action={action} className="card p-6">
      <h2 className="text-[16px] font-extrabold text-navy-900">Término anticipado</h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
        Calculamos la devolución proporcional a los días no usados del periodo y el pago que
        corresponde al bodeguero.
      </p>

      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="daysUsed" value={days} />

      <div className="mt-6">
        <label htmlFor="days" className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
          Días usados del mes
        </label>
        <div className="mt-2 flex items-center gap-4">
          <input
            id="days"
            type="range"
            min={0}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="flex-1 accent-navy-800"
          />
          <span className="w-20 text-right text-[20px] font-extrabold text-navy-900 tabular-nums">
            {days}
            <span className="text-[12px] font-bold text-ink-400"> / 30</span>
          </span>
        </div>
      </div>

      <dl className="mt-6 space-y-2.5 rounded-field bg-surface-50 p-4 text-[13.5px]">
        <div className="flex justify-between">
          <dt className="text-ink-500">Arriendo del periodo</dt>
          <dd className="font-bold text-navy-900 tabular-nums">{formatCLP(result.periodBase)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Pago al bodeguero ({days} días)</dt>
          <dd className="font-bold text-navy-900 tabular-nums">−{formatCLP(result.hostAmount)}</dd>
        </div>
        <div className="flex justify-between border-t border-line-200 pt-2.5">
          <dt className="font-extrabold text-navy-900">Te devolvemos</dt>
          <dd className="text-[17px] font-extrabold text-success-700 tabular-nums">
            {formatCLP(result.refund)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-[12.5px] leading-relaxed text-ink-500">
        La devolución se libera desde la custodia a tu medio de pago en 3 a 5 días hábiles.
      </p>

      <div className="mt-5 space-y-3">
        <FormError>{state?.error}</FormError>
        {state?.ok ? (
          <p role="status" className="rounded-field bg-success-50 px-3.5 py-3 text-[13px] font-semibold text-success-700">
            {state.ok}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Confirm />
        </div>
      </div>
    </form>
  );
}

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" full disabled={pending}>
      {pending ? 'Procesando…' : 'Confirmar término'}
    </Button>
  );
}
