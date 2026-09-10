'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addTicketNote, setTicketStatus, type CommsState } from '@/app/comms/actions';
import { Button } from '@/components/ui/button';
import { FormError, Textarea } from '@/components/ui/field';
import { LABELS } from '@bodgo/core';

export type TicketNote = {
  id: string;
  body: string;
  autor: string;
  mio: boolean;
  equipo: boolean;
  cuando: string;
};

/**
 * Hilo del ticket.
 *
 * Es una conversación, no una bitácora interna: quien lo abrió ve todo lo que
 * escribe el equipo. Por eso las respuestas de BodGo van marcadas — importa
 * saber si contesta la plataforma o si uno se está hablando solo.
 */
export function TicketThread({
  ticketId,
  notes,
  cerrado,
}: {
  ticketId: string;
  notes: TicketNote[];
  cerrado: boolean;
}) {
  const [state, action] = useActionState<CommsState, FormData>(addTicketNote, null);
  const caja = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) caja.current?.reset();
  }, [state]);

  return (
    <section className="space-y-3">
      <ul className="space-y-2.5">
        {notes.map((n) => (
          <li
            key={n.id}
            className={`rounded-[14px] p-3.5 ${
              n.equipo ? 'border border-brand-600/25 bg-brand-50' : 'border border-line-100 bg-white'
            }`}
          >
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-700">{n.body}</p>
            <p className="mt-2 text-[11px] text-ink-500">
              {n.equipo ? 'Equipo BodGo' : n.autor}
              {n.mio && !n.equipo ? ' · tú' : ''} · {n.cuando}
            </p>
          </li>
        ))}
      </ul>

      {cerrado ? (
        <p className="rounded-[12px] bg-surface-25 p-3.5 text-[12.5px] leading-relaxed text-ink-500">
          Este ticket está resuelto. Si el problema sigue, responde acá y el equipo lo reabre.
        </p>
      ) : null}

      <form ref={caja} action={action} className="space-y-2.5">
        <input type="hidden" name="ticketId" value={ticketId} />
        <label className="sr-only" htmlFor="respuesta">
          Respuesta
        </label>
        <Textarea id="respuesta" name="body" rows={3} placeholder="Escribe tu respuesta…" />
        <FormError>{state?.error}</FormError>
        <Responder />
      </form>
    </section>
  );
}

function Responder() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar'}
    </Button>
  );
}

const SIGUIENTE: Record<string, { status: 'open' | 'in_progress' | 'resolved'; label: string }> = {
  open: { status: 'in_progress', label: 'Tomar el ticket' },
  in_progress: { status: 'resolved', label: 'Marcar como resuelto' },
  resolved: { status: 'open', label: 'Reabrir' },
};

/** Control de estado. Sólo lo ve el equipo: RLS deja el update al admin. */
export function TicketStatusControl({ ticketId, status }: { ticketId: string; status: string }) {
  const [state, action] = useActionState<CommsState, FormData>(setTicketStatus, null);
  const siguiente = SIGUIENTE[status];
  if (!siguiente) return null;

  return (
    <form action={action} className="card flex flex-wrap items-center gap-3 p-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="status" value={siguiente.status} />

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-navy-900">
          Estado: {LABELS.ticketStatus[status as keyof typeof LABELS.ticketStatus]}
        </p>
        {state?.ok ? (
          <p role="status" className="mt-0.5 text-[12px] font-bold text-success-700">
            {state.ok}
          </p>
        ) : (
          <FormError>{state?.error}</FormError>
        )}
      </div>

      <Mover label={siguiente.label} secundario={status === 'resolved'} />
    </form>
  );
}

function Mover({ label, secundario }: { label: string; secundario: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={secundario ? 'secondary' : 'primary'} disabled={pending}>
      {pending ? 'Guardando…' : label}
    </Button>
  );
}
