import { drivingDistanceKm, estimatedMinutes } from './geo';

/**
 * Tarifas de despacho al comprador.
 *
 * Se cobra por zona y no por kilómetro: el comprador quiere saber cuánto paga
 * antes de comprar, no una cifra que cambie según el tráfico.
 */
export const DELIVERY_ZONES = [
  { zone: 1, maxKm: 3, price: 2_500 },
  { zone: 2, maxKm: 6, price: 3_200 },
  { zone: 3, maxKm: 10, price: 3_900 },
  { zone: 4, maxKm: Infinity, price: 4_900 },
] as const;

/** Comisión que BodGo retiene de cada viaje. El resto es del repartidor. */
export const COURIER_COMMISSION_RATE = 0.18;

export type DeliveryQuote = {
  /** Distancia estimada de manejo, en km. */
  distanceKm: number;
  /** Zona tarifaria, de 1 a 4. */
  zone: number;
  /** Lo que paga el comprador. */
  buyerFee: number;
  /** Lo que retiene BodGo. */
  commission: number;
  /** Lo que gana el repartidor. */
  courierFee: number;
  /** Minutos estimados del viaje. */
  etaMinutes: number;
};

/** Zona tarifaria que corresponde a una distancia. */
export function zoneFor(distanceKm: number) {
  return DELIVERY_ZONES.find((z) => distanceKm <= z.maxKm) ?? DELIVERY_ZONES[3];
}

/**
 * Cotiza un despacho a partir de la distancia.
 *
 * El pago al repartidor se redondea a la centena: es plata que se le muestra
 * en pantalla antes de aceptar el viaje y no tiene por qué venir con pesos
 * sueltos.
 */
export function quoteDelivery(distanceKm: number): DeliveryQuote {
  const km = Math.max(0, Math.round(distanceKm * 10) / 10);
  const tier = zoneFor(km);
  const courierFee = Math.round((tier.price * (1 - COURIER_COMMISSION_RATE)) / 100) * 100;

  return {
    distanceKm: km,
    zone: tier.zone,
    buyerFee: tier.price,
    commission: tier.price - courierFee,
    courierFee,
    etaMinutes: estimatedMinutes(km),
  };
}

/**
 * Cotiza un despacho desde una bodega hacia una comuna.
 * Devuelve `null` cuando no se puede estimar la distancia.
 */
export function quoteDeliveryToComuna(
  origin: { lat: number | null; lng: number | null },
  destinationComuna: string,
): DeliveryQuote | null {
  const km = drivingDistanceKm(origin, destinationComuna);
  return km == null ? null : quoteDelivery(km);
}

/** Ganancia neta de un conjunto de viajes ya entregados. */
export function totalCourierEarnings(fees: readonly number[]): number {
  return fees.reduce((sum, fee) => sum + fee, 0);
}
