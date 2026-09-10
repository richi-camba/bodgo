'use client';

import { useActionState } from 'react';
import { toggleNotificationPreference, type ActionState } from '@/app/app/actions';
import { Switch } from '@/components/app/switch';

export function PreferenceSwitch({
  campo,
  activo,
  label,
  hint,
}: {
  campo: string;
  activo: boolean;
  label: string;
  hint: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(toggleNotificationPreference, null);

  return (
    <form action={action} className="flex items-center gap-3 px-4 py-3.5">
      <input type="hidden" name="campo" value={campo} />
      <input type="hidden" name="valor" value={activo ? 'off' : 'on'} />

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-navy-900">{label}</p>
        <p className="mt-px truncate text-[11.5px] text-ink-500">{hint}</p>
        {state?.error ? (
          <p role="alert" className="mt-1 text-[11.5px] font-bold text-danger-700">
            {state.error}
          </p>
        ) : null}
      </div>

      <Switch activo={activo} label={label} />
    </form>
  );
}
