'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toggleWarehouse, updateWarehouse, type ActionState } from '@/app/bodeguero/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { StickyBar } from '@/components/app/step-header';
import { formatNumber, usableCapacityM3 } from '@bodgo/core';

export function EditSpaceForm({
  warehouseId,
  comuna,
  address,
  addressReference,
  totalM2,
  pricePerM2,
  description,
  access247,
  arrendados,
  status,
}: {
  warehouseId: string;
  comuna: string;
  address: string;
  addressReference: string | null;
  totalM2: number;
  pricePerM2: number;
  description: string | null;
  access247: boolean;
  arrendados: number;
  status: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateWarehouse, null);

  return (
    <>
      <form action={action} className="space-y-4 pb-28">
        <input type="hidden" name="warehouseId" value={warehouseId} />

        <div className="card space-y-4 p-4">
          <Field label="Comuna" htmlFor="comuna">
            <Input id="comuna" name="comuna" required defaultValue={comuna} />
          </Field>

          <Field
            label="Dirección"
            htmlFor="address"
            hint="Sólo se le muestra a la PyME una vez firmado el contrato. En el buscador se ve el sector."
          >
            <Input id="address" name="address" required defaultValue={address} />
          </Field>

          <Field label="Referencia (opcional)" htmlFor="addressReference">
            <Input
              id="addressReference"
              name="addressReference"
              defaultValue={addressReference ?? ''}
              placeholder="Subterráneo, box 4"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Capacidad (m²)"
              htmlFor="totalM2"
              hint={
                arrendados > 0
                  ? `Tienes ${formatNumber(arrendados, 1)} m² arrendados: no puede bajar de ahí.`
                  : `Equivale a ${formatNumber(usableCapacityM3(totalM2), 1)} m³ apilables.`
              }
            >
              <Input
                id="totalM2"
                name="totalM2"
                type="number"
                step="0.5"
                min={Math.max(1, arrendados)}
                required
                defaultValue={totalM2}
              />
            </Field>

            <Field label="Precio por m² al mes" htmlFor="pricePerM2">
              <Input
                id="pricePerM2"
                name="pricePerM2"
                type="number"
                step="1000"
                min="1000"
                required
                defaultValue={pricePerM2}
              />
            </Field>
          </div>

          <Field label="Descripción para la PyME" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={description ?? ''}
              placeholder="Acceso por reja, piso de cemento, sin humedad."
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-line-200 p-3.5">
            <input
              type="checkbox"
              name="access247"
              defaultChecked={access247}
              className="h-[18px] w-[18px] shrink-0 accent-navy-800"
            />
            <span>
              <span className="block text-[14px] font-bold text-navy-900">Acceso 24/7</span>
              <span className="block text-[11.5px] text-ink-500">
                La PyME puede retirar a cualquier hora
              </span>
            </span>
          </label>

          {state?.ok ? (
            <p
              role="status"
              className="flex items-center gap-2.5 rounded-[12px] bg-success-50 p-3 text-[13px] font-bold text-success-700"
            >
              <Icon name="listo" size={16} />
              {state.ok}
            </p>
          ) : null}

          <FormError>{state?.error}</FormError>
        </div>

        <StickyBar>
          <Guardar />
        </StickyBar>
      </form>

      {/* La visibilidad se cambia sola: no es un campo del formulario sino una
          decisión que se toma de golpe, y mezclarlas haría que pausar el
          espacio dependiera de que el resto de los datos sean válidos. */}
      {status === 'active' || status === 'paused' ? (
        <Visibilidad warehouseId={warehouseId} status={status} />
      ) : null}
    </>
  );
}

function Visibilidad({ warehouseId, status }: { warehouseId: string; status: 'active' | 'paused' | string }) {
  const [state, action] = useActionState<ActionState, FormData>(toggleWarehouse, null);
  const pausado = status === 'paused';

  return (
    <form action={action} className="card mb-6 flex items-center gap-3 p-3.5">
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <input type="hidden" name="next" value={pausado ? 'active' : 'paused'} />

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-navy-900">Bodega activa</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-500">
          {pausado
            ? 'Pausada: no aparece en el buscador ni recibe nuevas PyMEs. Los contratos vigentes siguen.'
            : 'Visible en el buscador para nuevas PyMEs.'}
        </p>
        {state?.ok ? (
          <p role="status" className="mt-1 text-[11.5px] font-bold text-success-700">
            {state.ok}
          </p>
        ) : null}
        <FormError>{state?.error}</FormError>
      </div>

      <Interruptor activo={!pausado} />
    </form>
  );
}

/**
 * Interruptor de visibilidad: se ve como el switch del prototipo pero es un
 * botón de envío, para que funcione igual sin JavaScript.
 */
function Interruptor({ activo }: { activo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={activo}
      aria-label="Bodega activa"
      disabled={pending}
      className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors disabled:opacity-60 ${
        activo ? 'bg-success-600' : 'bg-line-300'
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] ${
          activo ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  );
}
