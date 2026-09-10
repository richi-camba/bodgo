'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { requestPasswordReset, type AuthState } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';

export function ResetRequestForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, null);

  if (state?.sent) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-700">
          <Icon name="listo" size={22} />
        </span>
        <h2 className="mt-4 text-[16px] font-extrabold text-navy-900">Revisa tu correo</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
          Si hay una cuenta con ese correo, le acaba de llegar un enlace para crear una contraseña
          nueva. Vence en una hora.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormError>{state?.error}</FormError>

      <Field label="Correo" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tucorreo@empresa.cl"
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
      {pending ? 'Enviando…' : 'Enviarme el enlace'}
    </Button>
  );
}
