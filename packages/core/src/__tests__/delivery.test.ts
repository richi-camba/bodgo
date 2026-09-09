import { describe, expect, it } from 'vitest';
import {
  COURIER_COMMISSION_RATE,
  DELIVERY_ZONES,
  quoteDelivery,
  quoteDeliveryToComuna,
  zoneFor,
} from '../delivery';
import { drivingDistanceKm, estimatedMinutes, haversineKm } from '../geo';

const PROVIDENCIA = { lat: -33.429, lng: -70.611 };

describe('zoneFor', () => {
  it('ubica cada distancia en su tramo', () => {
    expect(zoneFor(1).zone).toBe(1);
    expect(zoneFor(3).zone).toBe(1);
    expect(zoneFor(3.1).zone).toBe(2);
    expect(zoneFor(10).zone).toBe(3);
    expect(zoneFor(25).zone).toBe(4);
  });
});

describe('quoteDelivery', () => {
  it('reproduce el viaje del prototipo: 6,4 km, Zona 3, $3.900 al comprador y $3.200 al repartidor', () => {
    const q = quoteDelivery(6.4);
    expect(q.zone).toBe(3);
    expect(q.buyerFee).toBe(3_900);
    expect(q.courierFee).toBe(3_200);
    expect(q.commission).toBe(700);
  });

  it('lo que paga el comprador siempre es comisión más pago al repartidor', () => {
    for (const km of [0.5, 3, 5.9, 6.1, 9.9, 14, 30]) {
      const q = quoteDelivery(km);
      expect(q.commission + q.courierFee).toBe(q.buyerFee);
    }
  });

  it('la comisión ronda el porcentaje declarado', () => {
    for (const z of DELIVERY_ZONES) {
      if (!Number.isFinite(z.maxKm)) continue;
      const q = quoteDelivery(z.maxKm);
      const rate = q.commission / q.buyerFee;
      // El redondeo del pago a la centena mueve la tasa efectiva unos puntos.
      expect(Math.abs(rate - COURIER_COMMISSION_RATE)).toBeLessThan(0.03);
    }
  });

  it('nunca cotiza una distancia negativa', () => {
    expect(quoteDelivery(-5).distanceKm).toBe(0);
    expect(quoteDelivery(-5).zone).toBe(1);
  });

  it('el repartidor nunca gana más de lo que paga el comprador', () => {
    for (const km of [0, 1, 7, 40]) {
      const q = quoteDelivery(km);
      expect(q.courierFee).toBeLessThan(q.buyerFee);
    }
  });
});

describe('distancias', () => {
  it('mide bien un tramo conocido: Providencia a Maipú son unos 22 km de calle', () => {
    // El prototipo mostraba 6,4 km para este mismo viaje, pero era un dato de
    // maqueta: en la calle son más de veinte. La tabla de tarifas sí se
    // respeta al pie de la letra; la distancia se calcula de verdad.
    const km = drivingDistanceKm(PROVIDENCIA, 'Maipú');
    expect(km).toBeGreaterThan(18);
    expect(km).toBeLessThan(26);
  });

  it('la distancia por calle es mayor que la línea recta', () => {
    const straight = haversineKm(PROVIDENCIA, { lat: -33.5224, lng: -70.5987 });
    expect(drivingDistanceKm(PROVIDENCIA, 'La Florida')!).toBeGreaterThan(straight);
  });

  it('devuelve null en vez de un cero engañoso cuando no sabe dónde queda', () => {
    expect(drivingDistanceKm(PROVIDENCIA, 'Valparaíso')).toBeNull();
    expect(drivingDistanceKm({ lat: null, lng: null }, 'Maipú')).toBeNull();
  });

  it('el tiempo estimado incluye el retiro y la entrega', () => {
    expect(estimatedMinutes(0)).toBe(5);
    expect(estimatedMinutes(6.4)).toBe(22);
  });
});

describe('quoteDeliveryToComuna', () => {
  it('cotiza desde la bodega hasta la comuna del comprador', () => {
    const q = quoteDeliveryToComuna(PROVIDENCIA, 'Ñuñoa');
    expect(q).not.toBeNull();
    expect(q!.zone).toBeLessThanOrEqual(2);
  });

  it('no inventa una tarifa para una comuna que no conoce', () => {
    expect(quoteDeliveryToComuna(PROVIDENCIA, 'Antofagasta')).toBeNull();
  });
});
