'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { marcarAvisosLeidos, type AvisoState } from '@/app/app/notificaciones/actions';
import { Button } from '@/components/ui/button';

export function MarkAllRead() {
  const [, action] = useActionState<AvisoState, FormData>(marcarAvisosLeidos, null);

  return (
    <form action={action}>
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? 'Marcando…' : 'Marcar todo como leído'}
    </Button>
  );
}
