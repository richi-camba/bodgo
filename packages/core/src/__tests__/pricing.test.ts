import { describe, expect, it } from 'vitest';
import {
  calculateEarlyTermination,
  calculateHostPayout,
  estimateByVolume,
  quoteContract,
} from '../pricing';

describe('quoteContract', () => {
  it('suma 8% de comisión sobre el arriendo', () => {
    const q = quoteContract(12, 45_000);
    expect(q.base).toBe(540_000);
    expect(q.commission).toBe(43_200);
    expect(q.total).toBe(583_200);
  });

  it('redondea la comisión al peso', () => {
    // 7 × 38.500 = 269.500 → 8% = 21.560
    expect(quoteContract(7, 38_500).commission).toBe(21_560);
  });

  it('no cobra comisión sobre cero m²', () => {
    expect(quoteContract(0, 45_000)).toMatchObject({ base: 0, commission: 0, total: 0 });
  });
});

describe('calculateHostPayout', () => {
  it('retiene 15% para BodGo', () => {
    const p = calculateHostPayout(640_000);
    expect(p.commission).toBe(96_000);
    expect(p.net).toBe(544_000);
  });

  it('bruto = comisión + neto, siempre', () => {
    for (const gross of [1, 999, 280_800, 1_234_567]) {
      const p = calculateHostPayout(gross);
      expect(p.commission + p.net).toBe(gross);
    }
  });
});

describe('calculateEarlyTermination', () => {
  it('prorratea sobre 30 días', () => {
    const t = calculateEarlyTermination(540_000, 12);
    expect(t.hostAmount).toBe(216_000);
    expect(t.refund).toBe(324_000);
  });

  it('devuelve todo si no se usó ningún día', () => {
    expect(calculateEarlyTermination(540_000, 0).refund).toBe(540_000);
  });

  it('no devuelve nada si se usó el mes completo', () => {
    expect(calculateEarlyTermination(540_000, 30).refund).toBe(0);
  });

  it('trunca los días fuera de rango en vez de devolver de más', () => {
    expect(calculateEarlyTermination(540_000, 45).refund).toBe(0);
    expect(calculateEarlyTermination(540_000, -3).refund).toBe(540_000);
  });

  it('pago al bodeguero + devolución = arriendo del periodo', () => {
    for (const days of [1, 7, 13, 29]) {
      const t = calculateEarlyTermination(333_333, days);
      expect(t.hostAmount + t.refund).toBe(333_333);
    }
  });
});

describe('estimateByVolume', () => {
  it('ubica cada tramo en su plan', () => {
    expect(estimateByVolume(14).plan).toBe('Compacta');
    expect(estimateByVolume(20).plan).toBe('Estándar');
    expect(estimateByVolume(25).plan).toBe('Amplia');
  });

  it('reproduce el precio "desde" de cada plan', () => {
    expect(estimateByVolume(14).monthly).toBe(170_000);
    expect(estimateByVolume(20).monthly).toBe(245_000);
    expect(estimateByVolume(25).monthly).toBe(340_000);
  });

  it('acota el rango a 1–27 m³', () => {
    expect(estimateByVolume(0).m3).toBe(1);
    expect(estimateByVolume(99).m3).toBe(27);
  });
});
