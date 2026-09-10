'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { captureLead, type LeadState } from '@/app/(marketing)/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select, Textarea } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { COMUNA_CENTROIDS } from '@bodgo/core';

const COMUNAS = Object.keys(COMUNA_CENTROIDS)
  .filter((c) => c !== 'Santiago Centro')
  .sort();

export function ContactForm() {
  const [state, action] = useActionState<LeadState, FormData>(captureLead, null);
  const [role, setRole] = useState<'pyme' | 'bodeguero'>('pyme');

  if (state?.ok) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-700">
          <Icon name="listo" size={22} />
        </span>
        <h3 className="mt-4 text-[17px] font-extrabold text-navy-900">Contacto recibido</h3>
        <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-ink-500">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-6 md:p-7">
      <input type="hidden" name="roleInterest" value={role} />

      {/* Señuelo para bots: fuera de la vista y fuera del recorrido de teclado. */}
      <div aria-hidden className="absolute left-[-9999px]">
        <label htmlFor="website">No completar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className="text-[12.5px] font-bold text-ink-700">Me interesa</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ['pyme', 'Guardar mi stock'],
              ['bodeguero', 'Arrendar mi espacio'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={role === value}
              onClick={() => setRole(value)}
              className={`rounded-field border px-3 py-3 text-[13.5px] font-bold transition-colors ${
                role === value
                  ? 'border-navy-800 bg-brand-50/60 text-navy-900'
                  : 'border-line-200 text-ink-700 hover:border-line-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="lead-name">
          <Input id="lead-name" name="name" required autoComplete="name" placeholder="Valentina Castro" />
        </Field>
        <Field label="Correo" htmlFor="lead-email">
          <Input
            id="lead-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="tucorreo@empresa.cl"
          />
        </Field>
      </div>

      <Field
        label="Comuna"
        htmlFor="lead-comuna"
        hint={
          role === 'pyme'
            ? 'Dónde están tus clientes, para avisarte cuando abramos cerca.'
            : 'Dónde está tu espacio.'
        }
      >
        <Select id="lead-comuna" name="comuna" defaultValue="">
          <option value="">Prefiero no decirlo</option>
          {COMUNAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Cuéntanos algo más (opcional)" htmlFor="lead-message">
        <Textarea
          id="lead-message"
          name="message"
          rows={3}
          maxLength={1000}
          placeholder={
            role === 'pyme'
              ? 'Vendo ropa por Mercado Libre y despacho unos 40 pedidos al mes.'
              : 'Tengo una bodega de 10 m² con acceso independiente.'
          }
        />
      </Field>

      <FormError>{state?.error}</FormError>

      <Submit />

      <p className="text-[11.5px] leading-relaxed text-ink-400">
        Usamos tus datos sólo para responderte. Puedes pedirnos que los borremos escribiendo a
        hola@bodgo.cl, como establece la Ley 19.628.
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Enviando…' : 'Quiero que me contacten'}
    </Button>
  );
}
