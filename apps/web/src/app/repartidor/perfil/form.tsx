'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateCourierProfile, type ActionState } from '../actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select } from '@/components/ui/field';
import { LABELS, VEHICLE_TYPES } from '@bodgo/core';

type Initial = {
  vehicle: string;
  plate: string;
  phone: string;
  bankName: string;
  bankLast4: string;
};

export function CourierProfileForm({ initial }: { initial: Initial }) {
  const [state, action] = useActionState<ActionState, FormData>(updateCourierProfile, null);

  return (
    <form action={action} className="card space-y-4 p-5">
      <h2 className="text-[15px] font-extrabold text-navy-900">Vehículo y pagos</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehículo" htmlFor="vehicle">
          <Select id="vehicle" name="vehicle" defaultValue={initial.vehicle}>
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>
                {LABELS.vehicle[v]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Patente" htmlFor="plate" hint="Déjala en blanco si andas en bicicleta.">
          <Input id="plate" name="plate" defaultValue={initial.plate} placeholder="ABCD-12" />
        </Field>
      </div>

      <Field label="Teléfono" htmlFor="phone">
        <Input id="phone" name="phone" defaultValue={initial.phone} placeholder="+56 9 1234 5678" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Banco" htmlFor="bankName">
          <Input id="bankName" name="bankName" defaultValue={initial.bankName} placeholder="Banco Estado" />
        </Field>
        <Field label="Últimos 4 de la cuenta" htmlFor="bankLast4">
          <Input
            id="bankLast4"
            name="bankLast4"
            inputMode="numeric"
            maxLength={4}
            defaultValue={initial.bankLast4}
            placeholder="8821"
          />
        </Field>
      </div>

      <FormError>{state?.error}</FormError>
      {state?.ok ? (
        <p role="status" className="rounded-field bg-success-50 px-3.5 py-3 text-[13px] font-semibold text-success-700">
          {state.ok}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  );
}
