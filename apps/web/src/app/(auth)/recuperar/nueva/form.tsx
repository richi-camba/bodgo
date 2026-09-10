'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { setNewPassword, type AuthState } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/field';

export function NewPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(setNewPassword, null);

  return (
    <form action={action} className="space-y-4">
      <FormError>{state?.error}</FormError>

      <Field label="Contraseña nueva" htmlFor="password" hint="Mínimo 8 caracteres.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>

      <Field label="Repítela" htmlFor="confirm">
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar y entrar'}
    </Button>
  );
}
