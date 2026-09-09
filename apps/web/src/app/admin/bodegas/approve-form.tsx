'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { approveWarehouse, type ActionState } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

export function ApproveForm({ warehouseId }: { warehouseId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(approveWarehouse, null);

  return (
    <div className="space-y-2">
      <p className="text-[12.5px] text-ink-500">
        Confirma que la visita de habilitación verificó el checklist antes de publicar.
      </p>

      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="warehouseId" value={warehouseId} />
          <input type="hidden" name="decision" value="active" />
          <Submit label="Habilitar y publicar" variant="success" />
        </form>

        <form action={action}>
          <input type="hidden" name="warehouseId" value={warehouseId} />
          <input type="hidden" name="decision" value="rejected" />
          <Submit label="Rechazar" variant="secondary" />
        </form>
      </div>

      {state?.error ? (
        <p role="alert" className="text-[12.5px] font-semibold text-danger-600">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-[12.5px] font-semibold text-success-700">
          {state.ok}
        </p>
      ) : null}
    </div>
  );
}

function Submit({ label, variant }: { label: string; variant: 'success' | 'secondary' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? 'Aplicando…' : label}
    </Button>
  );
}
