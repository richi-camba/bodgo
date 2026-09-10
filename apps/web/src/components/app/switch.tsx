'use client';

import { useFormStatus } from 'react-dom';

/**
 * Interruptor de preferencia.
 *
 * Se ve como el switch del prototipo pero es un botón de envío dentro de su
 * propio formulario: funciona sin JavaScript y no necesita un botón «guardar»
 * aparte para una decisión que es de un solo golpe.
 */
export function Switch({ activo, label }: { activo: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={activo}
      aria-label={label}
      disabled={pending}
      className={`relative h-[26px] w-11 shrink-0 rounded-pill transition-colors disabled:opacity-60 ${
        activo ? 'bg-brand-600' : 'bg-line-300'
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-[left] ${
          activo ? 'left-[21px]' : 'left-[3px]'
        }`}
      />
    </button>
  );
}
