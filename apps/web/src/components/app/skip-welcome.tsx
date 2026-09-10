'use client';

import { useFormStatus } from 'react-dom';
import { skipWelcome } from '@/app/onboarding/actions';

/**
 * Saltar la bienvenida.
 *
 * Es un segundo botón de envío del mismo formulario, con su propia acción:
 * un `<form>` anidado dentro de otro no es HTML válido y rompe la
 * hidratación. Marca la cuenta como puesta en marcha igual — la idea es no
 * volver a preguntar, no obligar a completarla.
 */
export function SkipWelcome() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formAction={skipWelcome}
      formNoValidate
      disabled={pending}
      className="w-full py-2 text-[13px] font-semibold text-ink-500 transition-colors hover:text-navy-800 disabled:opacity-60"
    >
      Saltar por ahora
    </button>
  );
}
