'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProduct, type ActionState } from '@/app/app/actions';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, FormError, Input, Select } from '@/components/ui/field';
import { PRODUCT_CATEGORIES } from '@bodgo/core';

/**
 * Edición del producto.
 *
 * El stock no se toca desde acá a propósito: lo mueven las recepciones y los
 * pedidos. Si se pudiera corregir a mano, la trazabilidad dejaría de cuadrar
 * y la conciliación con el conteo físico no significaría nada.
 */
export function EditProductForm({
  productId,
  name,
  sku,
  category,
  unitVolumeM3,
  targetStock,
}: {
  productId: string;
  name: string;
  sku: string;
  category: string | null;
  unitVolumeM3: number;
  targetStock: number | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateProduct, null);

  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="productId" value={productId} />

      <FormError>{state?.error}</FormError>

      <Field label="Nombre del producto" htmlFor="name">
        <Input id="name" name="name" required defaultValue={name} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SKU" htmlFor="sku">
          <Input id="sku" name="sku" required defaultValue={sku} />
        </Field>

        <Field label="Categoría" htmlFor="category">
          <Select id="category" name="category" defaultValue={category ?? ''}>
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
        label="Stock objetivo (opcional)"
        htmlFor="targetStock"
        hint="Cuántas unidades quieres tener en bodega. Es el techo de la barra del inventario y lo que dispara el aviso de reposición."
      >
        <Input
          id="targetStock"
          name="targetStock"
          type="number"
          min="1"
          step="1"
          defaultValue={targetStock ?? ''}
        />
      </Field>

      <Field
        label="Volumen unitario (m³)"
        htmlFor="unitVolumeM3"
        hint="Cuánto ocupa una unidad. Cambiarlo afecta el cálculo de los próximos envíos, no el de los ya despachados."
      >
        <Input
          id="unitVolumeM3"
          name="unitVolumeM3"
          type="number"
          step="0.0001"
          min="0"
          required
          defaultValue={unitVolumeM3}
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <ButtonLink href={`/app/inventario/${productId}`} variant="secondary">
          Cancelar
        </ButtonLink>
        <Guardar />
      </div>
    </form>
  );
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending}>
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  );
}
