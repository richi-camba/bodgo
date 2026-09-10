'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createWarehouse, type ActionState } from '@/app/bodeguero/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/field';
import {
  calculateHostPayout,
  formatCLP,
  formatNumber,
  HOST_COMMISSION_RATE,
  usableCapacityM3,
} from '@bodgo/core';

const CHECKLIST = [
  { item: 'Acceso independiente', hint: 'Se puede entrar sin pasar por espacios privados' },
  { item: 'Superficie despejada', hint: 'Piso libre, sin humedad ni filtraciones' },
  { item: 'Extintor vigente', hint: 'Con carga al día y a la vista' },
  { item: 'Cierre seguro', hint: 'Puerta con llave o candado propio' },
  { item: 'Documento del espacio', hint: 'Certificado de dominio o contrato de arriendo' },
];

export function NewWarehouseForm() {
  const [m2, setM2] = useState(12);
  const [pricePerM2, setPricePerM2] = useState(45000);
  const [state, action] = useActionState<ActionState, FormData>(createWarehouse, null);

  const monthly = m2 * pricePerM2;
  const payout = calculateHostPayout(monthly);

  return (
    <form action={action} className="space-y-5">
      {/* -------------------------------------------------------- ubicación */}
      <fieldset className="card space-y-4 p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">¿Dónde está el espacio?</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Comuna" htmlFor="comuna">
            <Input id="comuna" name="comuna" required placeholder="Providencia" />
          </Field>
          <Field label="Dirección" htmlFor="address" hint="Sólo la ve una PyME con contrato firmado.">
            <Input id="address" name="address" required placeholder="Av. Manuel Montt 1240" />
          </Field>
        </div>

        <Field label="Referencia (opcional)" htmlFor="addressReference">
          <Input id="addressReference" name="addressReference" placeholder="Entrada independiente por el patio" />
        </Field>

        <Field label="Descripción para la PyME" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Bodega seca de 12 m² con acceso independiente, piso de cemento pulido y portón de 2 m."
          />
        </Field>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Horario de recepción"
            htmlFor="receptionHours"
            hint="Es la primera pregunta de quien va a dejar los bultos."
          >
            <Input id="receptionHours" name="receptionHours" placeholder="Lun a Vie 9:00–19:00" />
          </Field>

          <Field label="Fin de semana (opcional)" htmlFor="weekendHours">
            <Input id="weekendHours" name="weekendHours" placeholder="Sáb 10:00–14:00" />
          </Field>
        </div>

        <label className="mt-4 flex items-center gap-2.5 text-[13px] text-ink-700">
          <input type="checkbox" name="access247" className="h-4 w-4 accent-navy-800" />
          Acceso 24/7 para la PyME
        </label>
      </fieldset>

      {/* -------------------------------------------------------- superficie */}
      <fieldset className="card p-5">
        <legend className="text-[15px] font-extrabold text-navy-900">Superficie y precio</legend>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Superficie total (m²)" htmlFor="totalM2">
            <Input
              id="totalM2"
              name="totalM2"
              type="number"
              min={1}
              max={60}
              step="0.5"
              required
              value={m2}
              onChange={(e) => setM2(Number(e.target.value))}
            />
          </Field>

          <Field label="Precio por m² al mes" htmlFor="pricePerM2">
            <Input
              id="pricePerM2"
              name="pricePerM2"
              type="number"
              min={1000}
              step={1000}
              required
              value={pricePerM2}
              onChange={(e) => setPricePerM2(Number(e.target.value))}
            />
          </Field>
        </div>

        <dl className="mt-4 space-y-2.5 rounded-field bg-surface-50 p-4 text-[13.5px]">
          <Row label="Capacidad apilable" value={`${formatNumber(usableCapacityM3(m2), 1)} m³`} />
          <Row label="Arriendo con el espacio completo" value={formatCLP(monthly)} />
          <Row
            label={`Comisión BodGo (${Math.round(HOST_COMMISSION_RATE * 100)}%)`}
            value={`−${formatCLP(payout.commission)}`}
          />
          <div className="flex items-center justify-between border-t border-line-200 pt-2.5">
            <dt className="font-extrabold text-navy-900">Recibes cada mes</dt>
            <dd className="text-[17px] font-extrabold text-success-700 tabular-nums">
              {formatCLP(payout.net)}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
          La capacidad se calcula apilando hasta 1,8 m de altura, no hasta el techo. Es el número
          contra el que se valida cada envío que recibas.
        </p>
      </fieldset>

      {/* --------------------------------------------------------- checklist */}
      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Checklist de habilitación</h2>
        <p className="mt-1 text-[12.5px] text-ink-500">
          BodGo verifica estos puntos en la visita, antes de publicar tu espacio.
        </p>
        <ul className="mt-4 space-y-2.5">
          {CHECKLIST.map((c) => (
            <li key={c.item} className="flex gap-3">
              <span aria-hidden className="mt-1 text-[12px] text-ink-400">
                ○
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-navy-900">{c.item}</p>
                <p className="text-[12px] text-ink-400">{c.hint}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-3">
        <FormError>{state?.error}</FormError>
        <p className="rounded-field bg-brand-50 p-3.5 text-[12.5px] leading-relaxed text-navy-800">
          Tu espacio queda en revisión, no publicado. Un evaluador agenda la visita en 3 a 5 días
          hábiles y recién ahí aparece en el buscador.
        </p>
        <Submit />
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar a revisión'}
    </Button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-bold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
