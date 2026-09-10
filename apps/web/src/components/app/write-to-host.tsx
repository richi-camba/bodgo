'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { openConversation, type CommsState } from '@/app/comms/actions';
import { Icon } from '@/components/ui/icon';

/**
 * Abre el chat con el bodeguero desde la ficha del espacio.
 *
 * Es el «chat previo a la contratación» del prototipo: se puede preguntar por
 * el acceso o los horarios antes de firmar nada.
 */
export function WriteToHost({
  warehouseId,
  bodegueroId,
}: {
  warehouseId: string;
  bodegueroId: string;
}) {
  const [state, action] = useActionState<CommsState, FormData>(openConversation, null);

  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <input type="hidden" name="bodegueroId" value={bodegueroId} />
      <Escribir />
      {state?.error ? (
        <p role="alert" className="mt-1 text-[11.5px] font-semibold text-danger-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function Escribir() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Escribir al bodeguero"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100 disabled:text-line-300"
    >
      <Icon name="mensajes" size={18} />
    </button>
  );
}
