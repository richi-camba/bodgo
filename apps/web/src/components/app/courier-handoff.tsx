'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerCourier, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Select } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { PhotoCapture } from '@/components/app/photo-capture';
import { COURIERS, formatCLP, shippingMargin, trackingUrlFor, type CourierId } from '@bodgo/core';

type Props = {
  orderId: string;
  /** Lo que ya se le cobró al comprador por el envío. */
  chargedToBuyer: number;
  initial: {
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    courierCost: number | null;
  };
};

/**
 * Registro del despacho.
 *
 * Cuando el courier tiene una URL de seguimiento predecible, se arma sola a
 * partir del número. Los que no la tienen —Uber, PedidosYa— piden pegar el
 * enlace, que es como funcionan de verdad.
 */
export function CourierHandoff({ orderId, chargedToBuyer, initial }: Props) {
  const [courierId, setCourierId] = useState<CourierId>(() => {
    const match = COURIERS.find((c) => c.label === initial.courierName);
    return match?.id ?? (initial.courierName ? 'otro' : 'chilexpress');
  });
  const [trackingNumber, setTrackingNumber] = useState(initial.trackingNumber ?? '');
  const [trackingUrl, setTrackingUrl] = useState(initial.trackingUrl ?? '');
  const [cost, setCost] = useState(initial.courierCost ?? 0);
  const [state, action] = useActionState<ActionState, FormData>(registerCourier, null);

  const courier = COURIERS.find((c) => c.id === courierId)!;
  const suggested = trackingUrlFor(courierId, trackingNumber);
  const effectiveUrl = trackingUrl || suggested || '';
  const margin = shippingMargin(chargedToBuyer, cost);

  return (
    <form action={action} className="card space-y-4 p-5">
      <div>
        <h2 className="text-[15px] font-extrabold text-navy-900">Datos del envío</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
          Registra con quién despachas y el enlace de seguimiento, para que el comprador pueda
          seguir su pedido.
        </p>
      </div>

      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="courierName" value={courier.label} />
      <input type="hidden" name="trackingUrl" value={effectiveUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Courier" htmlFor="courier">
          <Select
            id="courier"
            value={courierId}
            onChange={(e) => setCourierId(e.target.value as CourierId)}
          >
            {COURIERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="N° de seguimiento" htmlFor="trackingNumber">
          <Input
            id="trackingNumber"
            name="trackingNumber"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="990012345678"
          />
        </Field>
      </div>

      <Field
        label="Enlace de seguimiento"
        htmlFor="trackingUrlInput"
        hint={
          suggested && !trackingUrl
            ? `Lo armamos solo con el número de ${courier.label}. Puedes reemplazarlo.`
            : 'Pega el enlace que te dio el courier.'
        }
      >
        <Input
          id="trackingUrlInput"
          type="url"
          value={effectiveUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <Field
        label="Costo del envío"
        htmlFor="courierCost"
        hint="Lo que le pagaste al courier. Se compara con lo que le cobraste al comprador."
      >
        <Input
          id="courierCost"
          name="courierCost"
          type="number"
          min={0}
          step={100}
          value={cost || ''}
          onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
          placeholder="3900"
        />
      </Field>

      {cost > 0 ? (
        <dl className="space-y-2 rounded-field bg-surface-50 p-4 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-ink-500">Cobrado al comprador</dt>
            <dd className="font-bold text-navy-900 tabular-nums">{formatCLP(chargedToBuyer)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Pagado al courier</dt>
            <dd className="font-bold text-navy-900 tabular-nums">−{formatCLP(cost)}</dd>
          </div>
          <div className="flex justify-between border-t border-line-200 pt-2">
            <dt className="font-extrabold text-navy-900">
              {margin < 0 ? 'Pones de tu bolsillo' : 'Tu margen en el envío'}
            </dt>
            <dd
              className={`text-[15px] font-extrabold tabular-nums ${
                margin < 0 ? 'text-danger-600' : 'text-success-700'
              }`}
            >
              {formatCLP(Math.abs(margin))}
            </dd>
          </div>
        </dl>
      ) : null}

      <PhotoCapture
        name="receiptPath"
        folder="comprobantes"
        label="Comprobante de pago (opcional)"
        hint="Foto de la boleta del courier"
      />

      <FormError>{state?.error}</FormError>
      {state?.ok ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-field bg-success-50 px-3.5 py-3 text-[13px] font-semibold text-success-700"
        >
          <Icon name="listo" size={16} />
          {state.ok}
        </p>
      ) : null}

      <Submit saved={Boolean(initial.courierName)} />
    </form>
  );
}

function Submit({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full disabled={pending}>
      {pending ? 'Guardando…' : saved ? 'Actualizar datos del envío' : 'Guardar datos del envío'}
    </Button>
  );
}
