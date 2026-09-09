'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { acceptDelivery, type ActionState } from './actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/stat';
import { formatCLP, formatNumber } from '@bodgo/core';

type Offer = {
  id: string | null;
  code: string | null;
  zone: number | null;
  distance_km: number | null;
  eta_minutes: number | null;
  courier_fee: number | null;
  pickup_comuna: string | null;
  pickup_sector: string | null;
  dropoff_comuna: string | null;
};

export function OfferList({ offers, online }: { offers: Offer[]; online: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(acceptDelivery, null);

  if (!online) {
    return (
      <EmptyState
        icon="🛵"
        title="Estás fuera de línea"
        body="Ponte en línea para empezar a recibir viajes de las microbodegas de tu zona."
      />
    );
  }

  if (offers.length === 0) {
    return (
      <EmptyState
        icon="🧭"
        title="No hay viajes disponibles"
        body="Apenas un bodeguero deje un pedido listo para retiro, aparece acá. Mantente en línea."
      />
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">
        {offers.length === 1 ? 'Un viaje disponible' : `${offers.length} viajes disponibles`}
      </h2>

      {state?.error ? (
        <p
          role="alert"
          className="mb-3 rounded-field border border-danger-600/25 bg-danger-50 px-3.5 py-3 text-[13px] font-semibold text-danger-600"
        >
          {state.error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {offers.map((offer) => (
          <li key={offer.id} className="card overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-line-100 bg-surface-25 px-5 py-3.5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400">
                  Nueva solicitud
                </p>
                <p className="mt-0.5 text-[12px] text-ink-400">
                  {offer.code} · Zona {offer.zone}
                </p>
              </div>
              <p className="text-[22px] font-extrabold leading-none text-success-700 tabular-nums">
                {formatCLP(offer.courier_fee ?? 0)}
              </p>
            </div>

            <div className="space-y-3 px-5 py-4">
              <Leg
                tag="Retiro"
                place={`Bodega ${offer.pickup_comuna}`}
                detail={offer.pickup_sector ?? 'Dirección exacta al aceptar'}
              />
              <Leg tag="Entrega" place={`Comprador · ${offer.dropoff_comuna}`} detail="Dirección exacta al aceptar" />

              <div className="flex flex-wrap gap-2 pt-1">
                {offer.distance_km != null ? (
                  <Badge>📍 {formatNumber(Number(offer.distance_km), 1)} km</Badge>
                ) : null}
                {offer.eta_minutes != null ? <Badge>⏱ ~{offer.eta_minutes} min</Badge> : null}
              </div>
            </div>

            <form action={action} className="border-t border-line-100 px-5 py-4">
              <input type="hidden" name="deliveryId" value={offer.id ?? ''} />
              <Accept />
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Accept() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full size="lg" variant="success" disabled={pending}>
      {pending ? 'Tomando el viaje…' : 'Aceptar viaje'}
    </Button>
  );
}

function Leg({ tag, place, detail }: { tag: string; place: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-navy-800"
      />
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{tag}</p>
        <p className="text-[14px] font-bold text-navy-900">{place}</p>
        <p className="text-[12px] text-ink-400">{detail}</p>
      </div>
    </div>
  );
}
