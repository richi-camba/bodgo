'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { savePymeBusiness, savePymeChannels, type WelcomeState } from '@/app/onboarding/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { WelcomeShell } from '@/components/app/welcome';
import { LABELS, PRODUCT_CATEGORIES } from '@bodgo/core';

const CANALES = ['mercadolibre', 'shopify', 'woocommerce', 'manual'] as const;

export function PymeBusinessStep({
  total,
  businessName,
  comuna,
  giro,
}: {
  total: number;
  businessName: string;
  comuna: string;
  giro: string;
}) {
  const [state, action] = useActionState<WelcomeState, FormData>(savePymeBusiness, null);

  return (
    <form action={action}>
      <WelcomeShell
        paso={1}
        total={total}
        titulo="¡Bienvenida a BodGo!"
        bajada="Configura tu cuenta en 3 pasos y empieza a despachar cerca de tus clientes."
        acciones={<Continuar />}
      >
        <div className="mt-[22px] space-y-3.5">
          <Field label="Nombre del negocio" htmlFor="businessName">
            <Input
              id="businessName"
              name="businessName"
              required
              defaultValue={businessName}
              placeholder="Boutique Lúa"
            />
          </Field>

          <Field
            label="Comuna principal"
            htmlFor="comuna"
            hint="Desde acá medimos qué tan cerca te queda cada microbodega."
          >
            <Input id="comuna" name="comuna" required defaultValue={comuna} placeholder="Providencia" />
          </Field>

          <Field label="Qué vendes" htmlFor="giro">
            <Select id="giro" name="giro" defaultValue={giro}>
              <option value="">Elige una categoría</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <FormError>{state?.error}</FormError>
        </div>
      </WelcomeShell>
    </form>
  );
}

/** Paso 2: la carga masiva ya existe, así que la bienvenida sólo lleva ahí. */
export function PymeInventoryStep() {
  return (
    <div className="flex w-full items-center gap-3">
      <Link
        href="/app/inventario/importar"
        className="flex flex-1 items-center justify-center gap-2 rounded-field border-[1.5px] border-brand-600 bg-white px-4 py-3 text-[14px] font-bold text-brand-600 transition-colors hover:bg-brand-50"
      >
        <Icon name="exportar" size={17} className="rotate-180" />
        Subir CSV
      </Link>
      <Link
        href="/bienvenida?paso=3"
        className="flex-1 rounded-field bg-navy-800 px-4 py-3 text-center text-[14px] font-bold text-white transition-colors hover:bg-navy-950"
      >
        Continuar
      </Link>
    </div>
  );
}

export function PymeChannelsStep({ total }: { total: number }) {
  const [state, action] = useActionState<WelcomeState, FormData>(savePymeChannels, null);
  const [elegidos, setElegidos] = useState<string[]>(['manual']);

  function alternar(c: string) {
    setElegidos((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  return (
    <form action={action}>
      <WelcomeShell
        paso={3}
        total={total}
        titulo="¿Por dónde vendes?"
        bajada="Lo dejamos anotado en tu perfil. La sincronización automática de ventas todavía no está conectada: por ahora los pedidos se cargan a mano."
        acciones={<Terminar />}
        saltar={false}
      >
        {elegidos.map((c) => (
          <input key={c} type="hidden" name="channels" value={c} />
        ))}

        <fieldset className="mt-[22px]">
          <legend className="mb-2.5 text-[12px] font-bold text-ink-700">Canal de venta</legend>
          <div className="flex flex-wrap gap-2.5">
            {CANALES.map((c) => {
              const activo = elegidos.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => alternar(c)}
                  className={`rounded-pill px-4 py-2.5 text-[13px] font-bold transition-colors ${
                    activo
                      ? 'bg-navy-800 text-white'
                      : 'border border-line-200 bg-white text-ink-700 hover:border-navy-800'
                  }`}
                >
                  {LABELS.salesChannel[c]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4">
          <FormError>{state?.error}</FormError>
        </div>
      </WelcomeShell>
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

function Terminar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Guardando…' : 'Empezar a usar BodGo'}
    </Button>
  );
}
