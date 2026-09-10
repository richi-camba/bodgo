'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn, type AuthState } from '@/app/auth/actions';
import { AuthTabs } from '@/components/app/auth-tabs';
import { SocialAuth } from '@/components/app/social-auth';
import { Button } from '@/components/ui/button';
import { Field, FormError, InputConIcono } from '@/components/ui/field';

const CALLBACK_ERRORS: Record<string, string> = {
  'sin-codigo': 'El enlace de acceso venció o ya se usó. Inicia sesión de nuevo.',
  sesion: 'No pudimos abrir la sesión. Inténtalo otra vez.',
};

export function SignInForm({ next, callbackError }: { next?: string; callbackError?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(signIn, null);

  return (
    <div className="space-y-5">
      <AuthTabs activa="ingresar" />

      <form action={action} className="space-y-4">
        <FormError>
          {state?.error ?? (callbackError ? CALLBACK_ERRORS[callbackError] : null)}
        </FormError>

        {next ? <input type="hidden" name="next" value={next} /> : null}

        <Field label="Correo" htmlFor="email">
          <InputConIcono
            icon="correo"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tucorreo@empresa.cl"
          />
        </Field>

        <Field label="Contraseña" htmlFor="password">
          <InputConIcono
            icon="clave"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Tu contraseña"
          />
        </Field>

        <p className="text-right">
          <Link
            href="/recuperar"
            className="text-[12.5px] font-semibold text-brand-600 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <Submit />
      </form>

      <SocialAuth next={next} />
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Entrando…' : 'Iniciar sesión'}
    </Button>
  );
}
