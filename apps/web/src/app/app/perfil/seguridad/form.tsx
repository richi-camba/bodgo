'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { changePassword, type AuthState } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';

export function ChangePasswordForm({ email }: { email: string }) {
  const [state, action] = useActionState<AuthState, FormData>(changePassword, null);

  return (
    <form action={action} className="card space-y-4 p-4">
      {/* El correo va oculto para que el gestor de contraseñas sepa a qué
          cuenta corresponde la clave nueva que se está guardando. */}
      <input type="hidden" name="email" autoComplete="username" value={email} readOnly />

      <Field label="Contraseña actual" htmlFor="current">
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </Field>

      <Field label="Nueva contraseña" htmlFor="password" hint="Mínimo 8 caracteres.">
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
      </Field>

      <Field label="Repetir nueva contraseña" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
      </Field>

      {state?.sent ? (
        <p
          role="status"
          className="flex items-center gap-2.5 rounded-[12px] bg-success-50 p-3 text-[13px] font-bold text-success-700"
        >
          <Icon name="listo" size={16} />
          Contraseña actualizada.
        </p>
      ) : null}

      <FormError>{state?.error}</FormError>

      <Actualizar />
    </form>
  );
}

function Actualizar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Actualizando…' : 'Actualizar contraseña'}
    </Button>
  );
}
