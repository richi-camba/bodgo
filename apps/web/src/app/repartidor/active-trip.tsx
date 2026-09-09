'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { advanceDelivery, type ActionState } from './actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { PhotoCapture } from '@/components/app/photo-capture';
import { formatCLP, formatNumber } from '@bodgo/core';

type Trip = {
  id: string;
  code: string;
  status: string;
  zone: number;
  distanceKm: number | null;
  etaMinutes: number | null;
  fee: number;
  orderCode: string;
  pickupComuna: string;
  pickupAddress: string;
  pickupReference: string | null;
  hostName: string | null;
  buyerName: string;
  buyerPhone: string | null;
  buyerAddress: string;
  buyerComuna: string;
  notes: string | null;
};

/**
 * Viaje en curso.
 *
 * Dos etapas: retirar en bodega y entregar al comprador. Cada una muestra sólo
 * la dirección que hace falta en ese momento, para no obligar al repartidor a
 * buscar el dato correcto en una pantalla llena.
 */
export function ActiveTrip({ trip }: { trip: Trip }) {
  const [state, action] = useActionState<ActionState, FormData>(advanceDelivery, null);
  const atPickup = trip.status === 'accepted';

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-card bg-navy-800 text-white">
        <div className="flex items-start justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-400">
              {atPickup ? 'Retiro en bodega' : 'En ruta al comprador'}
            </p>
            <p className="mt-1 text-[15px] font-extrabold">
              {trip.code} · pedido {trip.orderCode}
            </p>
          </div>
          <p className="text-[22px] font-extrabold leading-none tabular-nums">
            {formatCLP(trip.fee)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 px-5 py-3 text-[11.5px] text-white/70">
          <span>Zona {trip.zone}</span>
          {trip.distanceKm != null ? <span>· {formatNumber(trip.distanceKm, 1)} km</span> : null}
          {trip.etaMinutes != null ? <span>· ~{trip.etaMinutes} min</span> : null}
        </div>
      </section>

      {/* -------------------------------------------------------- destino */}
      <section className="card p-5">
        {atPickup ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">
                  Retirar en
                </p>
                <h2 className="mt-1 text-[17px] font-extrabold text-navy-900">
                  Bodega {trip.pickupComuna}
                </h2>
                <p className="mt-1 text-[14px] text-ink-700">{trip.pickupAddress}</p>
                {trip.pickupReference ? (
                  <p className="text-[12.5px] text-ink-400">{trip.pickupReference}</p>
                ) : null}
                {trip.hostName ? (
                  <p className="mt-2 text-[12.5px] text-ink-500">Pregunta por {trip.hostName}</p>
                ) : null}
              </div>
              <Badge tone="brand">Paso 1 de 2</Badge>
            </div>

            <MapLink query={`${trip.pickupAddress}, ${trip.pickupComuna}`} />
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">
                  Entregar a
                </p>
                <h2 className="mt-1 text-[17px] font-extrabold text-navy-900">{trip.buyerName}</h2>
                <p className="mt-1 text-[14px] text-ink-700">
                  {trip.buyerAddress}, {trip.buyerComuna}
                </p>
                {trip.buyerPhone ? (
                  <a
                    href={`tel:${trip.buyerPhone.replace(/\s/g, '')}`}
                    className="mt-2 inline-block text-[13px] font-bold text-brand-600 hover:underline"
                  >
                    Llamar {trip.buyerPhone}
                  </a>
                ) : null}
              </div>
              <Badge tone="brand">Paso 2 de 2</Badge>
            </div>

            {trip.notes ? (
              <p className="mt-4 rounded-field bg-surface-50 p-3.5 text-[12.5px] leading-relaxed text-ink-700">
                Nota del comprador: {trip.notes}
              </p>
            ) : null}

            <MapLink query={`${trip.buyerAddress}, ${trip.buyerComuna}`} />
          </>
        )}
      </section>

      {/* --------------------------------------------------------- acción */}
      <form action={action} className="card space-y-4 p-5">
        <input type="hidden" name="deliveryId" value={trip.id} />
        <input type="hidden" name="status" value={atPickup ? 'picked_up' : 'delivered'} />

        {atPickup ? (
          <PhotoCapture
            name="photoPath"
            folder="retiros"
            label="Foto del retiro (opcional)"
            hint="Los bultos cargados, antes de salir"
          />
        ) : (
          <PhotoCapture
            name="photoPath"
            folder="entregas"
            label="Foto de la entrega"
            hint="El paquete en la puerta o con quien lo recibe"
          />
        )}

        <FormError>{state?.error}</FormError>

        <Confirm label={atPickup ? 'Confirmar retiro de mercancía' : 'Confirmar entrega'} />

        {!atPickup ? (
          <p className="text-center text-[12px] text-ink-400">
            La foto es obligatoria: es el respaldo de que el pedido llegó.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function Confirm({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" full size="lg" variant="success" disabled={pending}>
      {pending ? 'Registrando…' : label}
    </Button>
  );
}

/** Abre la dirección en la app de mapas del teléfono. */
function MapLink({ query }: { query: string }) {
  return (
    <a
      href={`https://maps.google.com/?q=${encodeURIComponent(query)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex items-center justify-center gap-2 rounded-field border border-line-200 py-3 text-[13.5px] font-bold text-navy-800 transition-colors hover:border-navy-800"
    >
      🧭 Abrir en mapas
    </a>
  );
}
