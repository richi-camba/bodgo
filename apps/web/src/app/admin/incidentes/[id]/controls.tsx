'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addIncidentNote, setIncidentStatus, type ActionState } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { FormError, Textarea } from '@/components/ui/field';
import { LABELS } from '@bodgo/core';

const SIGUIENTE: Record<string, { status: 'open' | 'in_progress' | 'resolved'; label: string } | null> = {
  open: { status: 'in_progress', label: 'Tomar el caso' },
  in_progress: { status: 'resolved', label: 'Marcar resuelto' },
  resolved: { status: 'open', label: 'Reabrir' },
};

/** Un solo botón: el estado siguiente, no un selector con las tres opciones. */
export function IncidentStatus({ incidentId, status }: { incidentId: string; status: string }) {
  const [state, action] = useActionState<ActionState, FormData>(setIncidentStatus, null);
  const siguiente = SIGUIENTE[status];
  if (!siguiente) return null;

  return (
    <form action={action} className="card flex flex-wrap items-center gap-3 p-4">
      <input type="hidden" name="incidentId" value={incidentId} />
      <input type="hidden" name="status" value={siguiente.status} />

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-navy-900">
          Estado: {LABELS.incidentStatus[status as keyof typeof LABELS.incidentStatus]}
        </p>
        {state?.ok ? (
          <p role="status" className="mt-0.5 text-[12px] font-bold text-success-700">
            {state.ok}
          </p>
        ) : (
          <FormError>{state?.error}</FormError>
        )}
      </div>

      <Mover label={siguiente.label} peligro={status === 'resolved'} />
    </form>
  );
}

function Mover({ label, peligro }: { label: string; peligro: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={peligro ? 'secondary' : 'primary'} disabled={pending}>
      {pending ? 'Guardando…' : label}
    </Button>
  );
}

type Nota = { id: string; body: string; autor: string; cuando: string };

/**
 * Bitácora interna del incidente.
 *
 * Las notas no se editan ni se borran: es el registro de qué se supo y
 * cuándo. Si hay que corregir algo, se agrega otra nota.
 */
export function IncidentNotes({ incidentId, notes }: { incidentId: string; notes: Nota[] }) {
  const [state, action] = useActionState<ActionState, FormData>(addIncidentNote, null);

  return (
    <section className="card p-4">
      <h2 className="text-[12px] font-bold uppercase tracking-[.04em] text-ink-500">
        Notas internas
      </h2>

      {notes.length ? (
        <ul className="mt-3 space-y-2.5">
          {notes.map((n) => (
            <li key={n.id} className="rounded-[12px] bg-surface-25 p-3">
              <p className="text-[13px] leading-relaxed text-ink-700">{n.body}</p>
              <p className="mt-1.5 text-[11px] text-ink-500">
                {n.autor} · {n.cuando}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-ink-500">Sin notas todavía.</p>
      )}

      <form action={action} className="mt-4 space-y-2.5">
        <input type="hidden" name="incidentId" value={incidentId} />
        <label className="sr-only" htmlFor="body">
          Nota interna
        </label>
        <Textarea id="body" name="body" rows={2} placeholder="Qué se hizo y qué falta." />

        {state?.ok ? (
          <p role="status" className="text-[12px] font-bold text-success-700">
            {state.ok}
          </p>
        ) : (
          <FormError>{state?.error}</FormError>
        )}

        <Agregar />
      </form>
    </section>
  );
}

function Agregar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? 'Guardando…' : 'Agregar nota'}
    </Button>
  );
}
