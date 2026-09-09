'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { resolveDiscrepancy, type ActionState } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Textarea } from '@/components/ui/field';

const OUTCOMES = [
  {
    value: 'accepted',
    title: 'Dar por válido el conteo',
    body: 'Se cierra el caso, se ajusta el stock a lo contado y el pago se libera al bodeguero.',
  },
  {
    value: 'recount',
    title: 'Pedir recuento al bodeguero',
    body: 'El caso queda abierto y se le pide volver a contar contra el manifiesto.',
  },
  {
    value: 'escalated',
    title: 'Escalar a incidente',
    body: 'Se abre un incidente de severidad alta para revisión del equipo BodGo.',
  },
] as const;

export function ResolveForm({ discrepancyId, closed }: { discrepancyId: string; closed: boolean }) {
  const [outcome, setOutcome] = useState<string>('accepted');
  const [state, action] = useActionState<ActionState, FormData>(resolveDiscrepancy, null);

  if (closed) {
    return (
      <section className="rounded-card border border-success-600/25 bg-success-50 p-5">
        <h2 className="text-[15px] font-extrabold text-success-700">Caso cerrado</h2>
        <p className="mt-1.5 text-[13.5px] text-ink-700">
          Esta discrepancia ya fue resuelta. Si aparece información nueva, ábrela como incidente.
        </p>
      </section>
    );
  }

  return (
    <form action={action} className="card p-6">
      <h2 className="text-[16px] font-extrabold text-navy-900">Resolución</h2>

      <input type="hidden" name="discrepancyId" value={discrepancyId} />
      <input type="hidden" name="outcome" value={outcome} />

      <ul className="mt-4 space-y-2">
        {OUTCOMES.map((o) => (
          <li key={o.value}>
            <label
              className={`flex cursor-pointer gap-3 rounded-field border p-3.5 transition-colors ${
                outcome === o.value ? 'border-navy-800 bg-brand-50/50' : 'border-line-200 hover:border-line-300'
              }`}
            >
              <input
                type="radio"
                name="outcomeChoice"
                checked={outcome === o.value}
                onChange={() => setOutcome(o.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-navy-800"
              />
              <span>
                <span className="block text-[13.5px] font-extrabold text-navy-900">{o.title}</span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">{o.body}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Field label="Nota interna (opcional)" htmlFor="note">
          <Textarea id="note" name="note" rows={2} placeholder="Hablé con la PyME, acepta el conteo." />
        </Field>
      </div>

      <div className="mt-4 space-y-3">
        <FormError>{state?.error}</FormError>
        {state?.ok ? (
          <p role="status" className="rounded-field bg-success-50 px-3.5 py-3 text-[13px] font-semibold text-success-700">
            {state.ok}
          </p>
        ) : null}
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending}>
      {pending ? 'Aplicando…' : 'Aplicar resolución'}
    </Button>
  );
}
