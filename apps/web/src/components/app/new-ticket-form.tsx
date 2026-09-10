'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTicket, type CommsState } from '@/app/comms/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select, Textarea } from '@/components/ui/field';
import { StickyBar } from '@/components/app/step-header';
import { TICKET_REASONS } from '@/lib/comms';

export function NewTicketForm() {
  const [state, action] = useActionState<CommsState, FormData>(createTicket, null);

  return (
    <form action={action} className="space-y-4 pb-28">
      <p className="rounded-[13px] bg-brand-50 p-3.5 text-[12.5px] leading-relaxed text-navy-800">
        Un ticket es con el equipo de BodGo, no con tu contraparte. Si es algo de coordinación del
        día a día —horarios, accesos, un bulto que llega tarde—, es más rápido por el chat.
      </p>

      <div className="card space-y-4 p-4">
        <Field label="Motivo" htmlFor="reason">
          <Select id="reason" name="reason" defaultValue="recepcion" required>
            {TICKET_REASONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Asunto" htmlFor="subject" hint="Una línea que resuma qué pasa.">
          <Input
            id="subject"
            name="subject"
            required
            maxLength={160}
            placeholder="Faltaron 3 unidades en la recepción ENV-4821"
          />
        </Field>

        <Field
          label="Qué pasó"
          htmlFor="body"
          hint="Incluye códigos si los tienes: el envío, el pedido o el contrato. Con eso el equipo no tiene que preguntar de nuevo."
        >
          <Textarea id="body" name="body" rows={5} required />
        </Field>

        <FormError>{state?.error}</FormError>
      </div>

      <StickyBar>
        <Abrir />
      </StickyBar>
    </form>
  );
}

function Abrir() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Abriendo…' : 'Abrir ticket'}
    </Button>
  );
}
