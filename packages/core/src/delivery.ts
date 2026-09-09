import { drivingDistanceKm, estimatedMinutes } from './geo';

/**
 * Tarifas de despacho al comprador.
 *
 * Se cobra por zona y no por kilómetro: el comprador quiere saber cuánto paga
 * antes de comprar, no una cifra que cambie según el tráfico. Lo que la PyME
 * le pague después al courier es otra cosa — se registra aparte, con su
 * comprobante, y la diferencia es su margen en el despacho.
 */
export const DELIVERY_ZONES = [
  { zone: 1, maxKm: 3, price: 2_500 },
  { zone: 2, maxKm: 6, price: 3_200 },
  { zone: 3, maxKm: 10, price: 3_900 },
  { zone: 4, maxKm: Infinity, price: 4_900 },
] as const;

export type DeliveryQuote = {
  /** Distancia estimada de manejo, en km. */
  distanceKm: number;
  /** Zona tarifaria, de 1 a 4. */
  zone: number;
  /** Lo que se le cobra al comprador por el envío. */
  buyerFee: number;
  /** Minutos estimados del trayecto. */
  etaMinutes: number;
};

/** Zona tarifaria que corresponde a una distancia. */
export function zoneFor(distanceKm: number) {
  return DELIVERY_ZONES.find((z) => distanceKm <= z.maxKm) ?? DELIVERY_ZONES[3];
}

/** Cotiza el envío a partir de la distancia. */
export function quoteDelivery(distanceKm: number): DeliveryQuote {
  const km = Math.max(0, Math.round(distanceKm * 10) / 10);
  const tier = zoneFor(km);

  return {
    distanceKm: km,
    zone: tier.zone,
    buyerFee: tier.price,
    etaMinutes: estimatedMinutes(km),
  };
}

/**
 * Cotiza el envío desde una bodega hacia una comuna.
 * Devuelve `null` cuando no se puede estimar la distancia.
 */
export function quoteDeliveryToComuna(
  origin: { lat: number | null; lng: number | null },
  destinationComuna: string,
): DeliveryQuote | null {
  const km = drivingDistanceKm(origin, destinationComuna);
  return km == null ? null : quoteDelivery(km);
}

/**
 * Margen del despacho: lo cobrado al comprador menos lo pagado al courier.
 * Negativo significa que la PyME puso plata de su bolsillo en ese envío.
 */
export function shippingMargin(chargedToBuyer: number, paidToCourier: number): number {
  return chargedToBuyer - paidToCourier;
}

/**
 * Couriers habituales en Chile, para el selector del despacho.
 *
 * `trackingUrl` arma el enlace de seguimiento a partir del número, cuando el
 * courier tiene una URL estable. Los que no la tienen piden pegar el enlace a
 * mano, que es como funciona hoy con las apps de delivery.
 */
export const COURIERS = [
  { id: 'chilexpress', label: 'Chilexpress', trackingUrl: (n: string) => `https://www.chilexpress.cl/Views/ChilexpressCL/Resultado-busqueda.aspx?DATA=${encodeURIComponent(n)}` },
  { id: 'starken', label: 'Starken', trackingUrl: (n: string) => `https://www.starken.cl/seguimiento?codigo=${encodeURIComponent(n)}` },
  { id: 'bluexpress', label: 'Blue Express', trackingUrl: (n: string) => `https://www.blue.cl/seguimiento/?n_seguimiento=${encodeURIComponent(n)}` },
  { id: 'correos', label: 'Correos de Chile', trackingUrl: (n: string) => `https://www.correos.cl/web/guest/seguimiento-en-linea?n=${encodeURIComponent(n)}` },
  { id: 'uber_flash', label: 'Uber Flash', trackingUrl: null },
  { id: 'pedidosya', label: 'PedidosYa Envíos', trackingUrl: null },
  { id: 'cabify', label: 'Cabify Envíos', trackingUrl: null },
  { id: 'otro', label: 'Otro courier', trackingUrl: null },
] as const;

export type CourierId = (typeof COURIERS)[number]['id'];

/** Enlace de seguimiento sugerido, si el courier tiene uno predecible. */
export function trackingUrlFor(courierId: string, trackingNumber: string): string | null {
  const courier = COURIERS.find((c) => c.id === courierId);
  if (!courier?.trackingUrl || !trackingNumber.trim()) return null;
  return courier.trackingUrl(trackingNumber.trim());
}
