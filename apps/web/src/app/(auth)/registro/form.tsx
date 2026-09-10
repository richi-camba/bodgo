'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signUp, type AuthState } from '@/app/auth/actions';
import { AuthTabs } from '@/components/app/auth-tabs';
import { SocialAuth } from '@/components/app/social-auth';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, InputConIcono } from '@/components/ui/field';

export function SignUpForm({ role }: { role: 'pyme' | 'bodeguero' }) {
  const [state, action] = useActionState<AuthState, FormData>(signUp, null);
  const isPyme = role === 'pyme';

  return (
    <div className="space-y-5">
      <AuthTabs activa="registro" rol={role === 'pyme' ? undefined : role} />

      <form action={action} className="space-y-4">
        <FormError>{state?.error}</FormError>

        <input type="hidden" name="role" value={role} />

        <Field label="Nombre y apellido" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Valentina Castro" />
        </Field>

        {isPyme ? (
        <Field label="Nombre del negocio" htmlFor="businessName" hint="Como lo conocen tus clientes.">
          <Input
            id="businessName"
            name="businessName"
            autoComplete="organization"
            placeholder="Boutique Lúa"
          />
        </Field>
        ) : null}

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

        <Field label="Contraseña" htmlFor="password" hint="Mínimo 8 caracteres.">
        <InputConIcono
          icon="clave"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Crea una contraseña"
        />
        </Field>

        <label className="flex items-start gap-2.5 pt-1 text-[12.5px] leading-relaxed text-ink-500">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-navy-800"
        />
        <span>
          Acepto los{' '}
          <a href="/terminos" className="font-bold text-brand-600 hover:underline">
            Términos
          </a>{' '}
          y la Política de Privacidad (Ley 19.628).
        </span>
        </label>

        <Submit label={isPyme ? 'Crear cuenta PyME' : 'Crear cuenta de bodeguero'} />
      </form>

      <SocialAuth />
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Creando cuenta…' : label}
    </Button>
  );
}
