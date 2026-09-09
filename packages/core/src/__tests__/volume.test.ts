import { describe, expect, it } from 'vitest';
import { checkCapacity, grossVolumeM3, pricePerM3, shipmentVolumeM3, usableCapacityM3 } from '../volume.js';

describe('capacidad', () => {
  it('12 m² contratados dan 21,6 m³ apilables', () => {
    expect(usableCapacityM3(12)).toBe(21.6);
  });

  it('el rango de la red va de 14 a 27 m³ útiles', () => {
    expect(usableCapacityM3(8)).toBeCloseTo(14.4, 1);
    expect(usableCapacityM3(15)).toBe(27);
  });

  it('el volumen del recinto usa la altura libre, no la de apilado', () => {
    expect(grossVolumeM3(12)).toBe(30);
    expect(grossVolumeM3(12)).toBeGreaterThan(usableCapacityM3(12));
  });

  it('deriva el precio por m³ desde el precio por m²', () => {
    expect(pricePerM3(45_000)).toBe(18_000);
  });
});

describe('shipmentVolumeM3', () => {
  it('suma volumen unitario por cantidad', () => {
    expect(
      shipmentVolumeM3([
        { unitVolumeM3: 0.012, quantity: 100 },
        { unitVolumeM3: 0.05, quantity: 20 },
      ]),
    ).toBe(2.2);
  });

  it('un envío vacío ocupa cero', () => {
    expect(shipmentVolumeM3([])).toBe(0);
  });
});

describe('checkCapacity', () => {
  it('acepta un envío que cabe', () => {
    const c = checkCapacity(10, 12);
    expect(c.exceeds).toBe(false);
    expect(c.excessM3).toBe(0);
    expect(c.percentUsed).toBe(46);
  });

  it('marca el excedente cuando no cabe', () => {
    const c = checkCapacity(25, 12);
    expect(c.exceeds).toBe(true);
    expect(c.excessM3).toBe(3.4);
    expect(c.percentUsed).toBeGreaterThan(100);
  });

  it('llenar la capacidad exacta no es exceso', () => {
    const c = checkCapacity(21.6, 12);
    expect(c.exceeds).toBe(false);
    expect(c.percentUsed).toBe(100);
  });
});
