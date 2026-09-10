import { describe, expect, it } from 'vitest';
import { stockPercent, stockStatus, unitsToTarget } from '../stock';

describe('stockStatus', () => {
  it('sin unidades es agotado, tenga objetivo o no', () => {
    expect(stockStatus(0, 100)).toBe('agotado');
    expect(stockStatus(0, null)).toBe('agotado');
  });

  it('sin objetivo no opina sobre si el stock alcanza', () => {
    expect(stockStatus(40, null)).toBe('sin-objetivo');
    expect(stockStatus(40, 0)).toBe('sin-objetivo');
  });

  it('avisa bajo un tercio del objetivo, y en el límite exacto todavía avisa', () => {
    expect(stockStatus(29, 100)).toBe('bajo');
    expect(stockStatus(30, 100)).toBe('bajo');
    expect(stockStatus(31, 100)).toBe('ok');
  });
});

describe('stockPercent', () => {
  it('mide contra el objetivo y no pasa de 100', () => {
    expect(stockPercent(50, 200)).toBe(25);
    expect(stockPercent(400, 200)).toBe(100);
  });

  it('sin objetivo no hay barra que dibujar', () => {
    expect(stockPercent(50, null)).toBe(0);
  });
});

describe('unitsToTarget', () => {
  it('dice cuánto falta reponer', () => {
    expect(unitsToTarget(120, 200)).toBe(80);
    expect(unitsToTarget(250, 200)).toBe(0);
    expect(unitsToTarget(10, null)).toBe(0);
  });
});
