'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProduct, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select } from '@/components/ui/field';
import { PRODUCT_CATEGORIES } from '@bodgo/core';

export function NewProductForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(createProduct, null);

  if (!open) {
    return (
      <Button variant="secondary" full onClick={() => setOpen(true)}>
        + Crear producto
      </Button>
    );
  }

  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="text-[16px] font-extrabold text-navy-900">Nuevo producto</h2>

      <FormError>{state?.error}</FormError>
      {state?.ok ? (
        <p role="status" className="rounded-field bg-success-50 px-3.5 py-3 text-[13px] font-semibold text-success-700">
          {state.ok}
        </p>
      ) : null}

      <Field label="Nombre del producto" htmlFor="name">
        <Input id="name" name="name" required placeholder="Polera algodón talla M" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU" htmlFor="sku">
          <Input id="sku" name="sku" required placeholder="SKU-0876" />
        </Field>

        <Field label="Categoría" htmlFor="category">
          <Select id="category" name="category" defaultValue="">
            <option value="">Sin categoría</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Volumen unitario (m³)"
        htmlFor="unitVolumeM3"
        hint="Cuánto ocupa una unidad. Una polera doblada ≈ 0,0035 m³; una caja de zapatos ≈ 0,012 m³."
      >
        <Input
          id="unitVolumeM3"
          name="unitVolumeM3"
          type="number"
          step="0.0001"
          min="0"
          required
          defaultValue="0.01"
        />
      </Field>

      <p className="text-[12.5px] text-ink-400">
        El stock inicial queda en cero: se suma cuando el bodeguero confirma tu primer envío.
      </p>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar producto'}
    </Button>
  );
}
