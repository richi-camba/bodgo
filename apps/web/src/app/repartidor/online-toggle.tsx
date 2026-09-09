'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { setOnline, type ActionState } from './actions';

export function OnlineToggle({ online }: { online: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(setOnline, null);

  return (
    <form action={action}>
      <input type="hidden" name="online" value={online ? 'false' : 'true'} />
      <Toggle online={online} />
      {state?.error ? (
        <p role="alert" className="mt-1 text-[12px] font-semibold text-danger-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function Toggle({ online }: { online: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={online}
      className={`flex items-center gap-2.5 rounded-pill px-4 py-2.5 text-[13px] font-extrabold transition-colors disabled:opacity-60 ${
        online ? 'bg-success-600 text-white' : 'bg-surface-100 text-ink-500 hover:bg-line-100'
      }`}
    >
      <span
        aria-hidden
        className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-white' : 'bg-ink-400'}`}
      />
      {pending ? 'Cambiando…' : online ? 'En línea' : 'Fuera de línea'}
    </button>
  );
}
