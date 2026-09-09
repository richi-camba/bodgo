'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toggleWarehouse, type ActionState } from '@/app/bodeguero/actions';
import { Button } from '@/components/ui/button';

export function WarehouseToggle({
  warehouseId,
  status,
}: {
  warehouseId: string;
  status: 'active' | 'paused';
}) {
  const [state, action] = useActionState<ActionState, FormData>(toggleWarehouse, null);
  const paused = status === 'paused';

  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <input type="hidden" name="next" value={paused ? 'active' : 'paused'} />

      <p className="flex-1 text-[12.5px] text-ink-500">
        {paused
          ? 'Está pausado: no aparece en el buscador y no puede recibir nuevas PyMEs.'
          : 'Visible en el buscador para nuevas PyMEs.'}
      </p>

      <Submit label={paused ? 'Reactivar espacio' : 'Pausar espacio'} />

      {state?.error ? (
        <p role="alert" className="w-full text-[12.5px] font-semibold text-danger-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? 'Guardando…' : label}
    </Button>
  );
}
