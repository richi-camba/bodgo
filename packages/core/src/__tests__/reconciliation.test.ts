import { describe, expect, it } from 'vitest';
import { reconcileReception, type ManifestLine } from '../reconciliation';

const line = (over: Partial<ManifestLine> = {}): ManifestLine => ({
  productId: 'p1',
  sku: 'SKU-0876',
  name: 'Polera algodón M',
  declared: 10,
  received: 10,
  ...over,
});

describe('reconcileReception', () => {
  it('no abre discrepancia cuando todo calza', () => {
    const r = reconcileReception([line(), line({ productId: 'p2', sku: 'SKU-0099' })], 10, 21.6);
    expect(r.hasDiscrepancy).toBe(false);
    expect(r.type).toBe('none');
    expect(r.matchRate).toBe(100);
  });

  it('detecta unidades faltantes', () => {
    const r = reconcileReception([line({ received: 7 })], 5, 21.6);
    expect(r.type).toBe('units');
    expect(r.unitsShort).toBe(3);
    expect(r.unitsOver).toBe(0);
    expect(r.lines[0]!.status).toBe('short');
  });

  it('detecta unidades de más', () => {
    const r = reconcileReception([line({ received: 14 })], 5, 21.6);
    expect(r.type).toBe('units');
    expect(r.unitsOver).toBe(4);
    expect(r.lines[0]!.status).toBe('over');
  });

  it('abre discrepancia de volumen aunque las unidades calcen', () => {
    const r = reconcileReception([line()], 30, 21.6);
    expect(r.type).toBe('volume');
    expect(r.hasDiscrepancy).toBe(true);
    expect(r.capacity.excessM3).toBe(8.4);
  });

  it('marca ambas causas cuando fallan las dos', () => {
    const r = reconcileReception([line({ received: 4 })], 30, 21.6);
    expect(r.type).toBe('both');
  });

  it('los faltantes y sobrantes no se compensan entre sí', () => {
    const r = reconcileReception(
      [line({ received: 6 }), line({ productId: 'p2', declared: 5, received: 9 })],
      5,
      21.6,
    );
    expect(r.unitsShort).toBe(4);
    expect(r.unitsOver).toBe(4);
    expect(r.declaredUnits).toBe(15);
    expect(r.receivedUnits).toBe(15);
    expect(r.hasDiscrepancy).toBe(true);
  });

  it('calcula la tasa de coincidencia por línea', () => {
    const r = reconcileReception(
      [line(), line({ productId: 'p2' }), line({ productId: 'p3', received: 1 })],
      5,
      21.6,
    );
    expect(r.matchRate).toBe(67);
  });
});
