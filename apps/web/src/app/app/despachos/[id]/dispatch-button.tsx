'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { dispatchShipment, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';

export function DispatchButton({ shipmentId }: { shipmentId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(dispatchShipment, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <FormError>{state?.error}</FormError>
      <p className="text-[12.5px] leading-relaxed text-ink-500">
        Al despachar avisamos al bodeguero para que espere la mercadería y la cuente contra este
        manifiesto.
      </p>
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending}>
      {pending ? 'Despachando…' : 'Marcar como despachado'}
    </Button>
  );
}
