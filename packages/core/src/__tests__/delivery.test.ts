import { describe, expect, it } from 'vitest';
import {
  COURIERS,
  DELIVERY_ZONES,
  quoteDelivery,
  quoteDeliveryToComuna,
  shippingMargin,
  trackingUrlFor,
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

  it('cada zona cuesta más que la anterior', () => {
    for (let i = 1; i < DELIVERY_ZONES.length; i += 1) {
      expect(DELIVERY_ZONES[i]!.price).toBeGreaterThan(DELIVERY_ZONES[i - 1]!.price);
    }
  });
});

describe('quoteDelivery', () => {
  it('reproduce la tarifa del prototipo: Zona 3 son $3.900 al comprador', () => {
    const q = quoteDelivery(6.4);
    expect(q.zone).toBe(3);
    expect(q.buyerFee).toBe(3_900);
  });

  it('nunca cotiza una distancia negativa', () => {
    expect(quoteDelivery(-5).distanceKm).toBe(0);
    expect(quoteDelivery(-5).zone).toBe(1);
  });
});

describe('shippingMargin', () => {
  it('es lo cobrado menos lo pagado al courier', () => {
    expect(shippingMargin(3_900, 3_200)).toBe(700);
  });

  it('avisa cuando el envío salió más caro de lo cobrado', () => {
    expect(shippingMargin(2_500, 4_100)).toBe(-1_600);
  });
});

describe('trackingUrlFor', () => {
  it('arma el enlace de los couriers que tienen uno predecible', () => {
    const url = trackingUrlFor('chilexpress', '990012345678');
    expect(url).toContain('chilexpress.cl');
    expect(url).toContain('990012345678');
  });

  it('no inventa un enlace para los que no lo tienen', () => {
    expect(trackingUrlFor('uber_flash', '1234')).toBeNull();
    expect(trackingUrlFor('otro', '1234')).toBeNull();
  });

  it('sin número de seguimiento no hay enlace', () => {
    expect(trackingUrlFor('starken', '   ')).toBeNull();
  });

  it('escapa el número para no romper la URL', () => {
    expect(trackingUrlFor('starken', 'AB 12/34')).toContain('AB%2012%2F34');
  });

  it('todos los couriers del selector tienen etiqueta', () => {
    for (const c of COURIERS) expect(c.label.length).toBeGreaterThan(2);
  });
});

describe('distancias', () => {
  it('mide bien un tramo conocido: Providencia a Maipú son unos 22 km de calle', () => {
    // El prototipo mostraba 6,4 km para este viaje, pero era un dato de
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
