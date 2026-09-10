'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveHostIdentity, saveHostSpace, skipWelcome, type WelcomeState } from '@/app/onboarding/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/field';
import { WelcomeShell } from '@/components/app/welcome';
import { usableCapacityM3 } from '@bodgo/core';

export function HostIdentityStep({
  total,
  fullName,
  rut,
  phone,
}: {
  total: number;
  fullName: string;
  rut: string;
  phone: string;
}) {
  const [state, action] = useActionState<WelcomeState, FormData>(saveHostIdentity, null);

  return (
    <form action={action}>
      <WelcomeShell
        paso={1}
        total={total}
        titulo="¡Bienvenido, bodeguero!"
        bajada="Registra tu espacio y prepáralo para recibir mercancía en 3 pasos."
        acciones={<Continuar />}
      >
        <div className="mt-[22px] space-y-3.5">
          <Field label="Nombre o razón social" htmlFor="fullName">
            <Input id="fullName" name="fullName" required defaultValue={fullName} />
          </Field>

          <Field
            label="RUT"
            htmlFor="rut"
            hint="Lo necesitamos para la boleta de tus liquidaciones."
          >
            <Input id="rut" name="rut" required defaultValue={rut} placeholder="12.345.678-9" />
          </Field>

          <Field label="Teléfono" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={phone} placeholder="+56 9 0000 0000" />
          </Field>

          <FormError>{state?.error}</FormError>
        </div>
      </WelcomeShell>
    </form>
  );
}

export function HostSpaceStep({ total }: { total: number }) {
  const [state, action] = useActionState<WelcomeState, FormData>(saveHostSpace, null);

  return (
    <form action={action}>
      <WelcomeShell
        paso={2}
        total={total}
        titulo="Datos de tu microbodega"
        bajada="Cuéntanos del espacio que quieres publicar. Queda en revisión hasta la visita de habilitación: nadie se publica solo en la red."
        acciones={<Publicar />}
      >
        <div className="mt-[22px] space-y-3.5">
          <Field label="Comuna" htmlFor="comuna">
            <Input id="comuna" name="comuna" required placeholder="Providencia" />
          </Field>

          <Field
            label="Dirección"
            htmlFor="address"
            hint="Sólo se le muestra a la PyME una vez firmado el contrato. En el buscador se ve el sector."
          >
            <Input id="address" name="address" required placeholder="Av. Manuel Montt 1240" />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              label="Capacidad (m²)"
              htmlFor="totalM2"
              hint={`10 m² equivalen a ${usableCapacityM3(10)} m³ apilables.`}
            >
              <Input id="totalM2" name="totalM2" type="number" step="0.5" min="1" required placeholder="12" />
            </Field>

            <Field label="Precio por m² al mes" htmlFor="pricePerM2">
              <Input
                id="pricePerM2"
                name="pricePerM2"
                type="number"
                step="1000"
                min="1000"
                required
                placeholder="45000"
              />
            </Field>
          </div>

          <Field
            label="Horario de recepción"
            htmlFor="receptionHours"
            hint="Es la primera pregunta de quien va a dejar los bultos."
          >
            <Input
              id="receptionHours"
              name="receptionHours"
              required
              placeholder="Lun a Vie 9:00–19:00"
            />
          </Field>

          <Field label="Horario de fin de semana (opcional)" htmlFor="weekendHours">
            <Input id="weekendHours" name="weekendHours" placeholder="Sáb 10:00–14:00" />
          </Field>

          <FormError>{state?.error}</FormError>
        </div>
      </WelcomeShell>
    </form>
  );
}

/**
 * Cierra la bienvenida del bodeguero.
 *
 * Usa la misma acción que «Saltar»: en el último paso no queda nada por
 * guardar, sólo marcar la cuenta como puesta en marcha.
 */
export function TerminarBienvenida() {
  return (
    <form action={skipWelcome} className="w-full">
      <Entrar />
    </form>
  );
}

function Continuar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Guardando…' : 'Continuar'}
    </Button>
  );
}

function Publicar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Publicando…' : 'Enviar a revisión'}
    </Button>
  );
}

function Entrar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Un momento…' : 'Ir a mi panel'}
    </Button>
  );
}
