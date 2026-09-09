/**
 * Geografía de la Región Metropolitana.
 *
 * BodGo no geocodifica direcciones: para calcular la tarifa de un despacho
 * alcanza con la distancia entre la bodega de origen y el centro de la comuna
 * de destino. Es una aproximación, y es la correcta — la tarifa se cobra por
 * zona, no por metro, así que afinar más no cambiaría el precio.
 */

/** Centro aproximado de cada comuna del Gran Santiago. */
export const COMUNA_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Cerrillos: { lat: -33.498, lng: -70.715 },
  'Cerro Navia': { lat: -33.423, lng: -70.737 },
  Conchalí: { lat: -33.383, lng: -70.675 },
  'El Bosque': { lat: -33.562, lng: -70.675 },
  'Estación Central': { lat: -33.46, lng: -70.697 },
  Huechuraba: { lat: -33.37, lng: -70.64 },
  Independencia: { lat: -33.416, lng: -70.664 },
  'La Cisterna': { lat: -33.533, lng: -70.662 },
  'La Florida': { lat: -33.5224, lng: -70.5987 },
  'La Granja': { lat: -33.539, lng: -70.625 },
  'La Pintana': { lat: -33.583, lng: -70.633 },
  'La Reina': { lat: -33.445, lng: -70.54 },
  'Las Condes': { lat: -33.4103, lng: -70.568 },
  'Lo Barnechea': { lat: -33.351, lng: -70.518 },
  'Lo Espejo': { lat: -33.523, lng: -70.689 },
  'Lo Prado': { lat: -33.444, lng: -70.723 },
  Macul: { lat: -33.489, lng: -70.598 },
  Maipú: { lat: -33.511, lng: -70.758 },
  Ñuñoa: { lat: -33.4569, lng: -70.5975 },
  'Pedro Aguirre Cerda': { lat: -33.487, lng: -70.674 },
  Peñalolén: { lat: -33.489, lng: -70.541 },
  Providencia: { lat: -33.4314, lng: -70.6093 },
  Pudahuel: { lat: -33.44, lng: -70.75 },
  'Puente Alto': { lat: -33.6116, lng: -70.5758 },
  'Quilicura': { lat: -33.367, lng: -70.729 },
  'Quinta Normal': { lat: -33.435, lng: -70.7 },
  Recoleta: { lat: -33.41, lng: -70.64 },
  Renca: { lat: -33.404, lng: -70.729 },
  'San Bernardo': { lat: -33.592, lng: -70.699 },
  'San Joaquín': { lat: -33.496, lng: -70.628 },
  'San Miguel': { lat: -33.4969, lng: -70.6512 },
  'San Ramón': { lat: -33.541, lng: -70.645 },
  Santiago: { lat: -33.4489, lng: -70.6693 },
  'Santiago Centro': { lat: -33.4489, lng: -70.6693 },
  Vitacura: { lat: -33.3899, lng: -70.5717 },
};

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia en línea recta entre dos puntos, en kilómetros. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Factor de rodeo: la calle nunca va en línea recta. 1,35 es la razón típica
 * entre el recorrido real y la distancia directa en trama urbana.
 */
export const ROAD_FACTOR = 1.35;

/**
 * Distancia de manejo estimada entre una bodega y una comuna de destino.
 *
 * Devuelve `null` si la comuna no está en el mapa o la bodega no tiene
 * coordenadas: quien llame decide qué hacer, en vez de recibir un cero que
 * parezca una distancia real.
 */
export function drivingDistanceKm(
  origin: { lat: number | null; lng: number | null },
  destinationComuna: string,
): number | null {
  const destination = COMUNA_CENTROIDS[destinationComuna.trim()];
  if (!destination || origin.lat == null || origin.lng == null) return null;

  const straight = haversineKm({ lat: origin.lat, lng: origin.lng }, destination);
  return Math.round(straight * ROAD_FACTOR * 10) / 10;
}

/** Minutos estimados de viaje, a la velocidad media urbana en moto. */
export const URBAN_SPEED_KMH = 22;

export function estimatedMinutes(distanceKm: number): number {
  // Cinco minutos fijos de retiro y entrega, más el trayecto.
  return Math.max(5, Math.round((distanceKm / URBAN_SPEED_KMH) * 60) + 5);
}
