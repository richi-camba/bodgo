import { describe, expect, it } from 'vitest';
import { formatCLP, formatCompactCLP, formatNumber } from '../money.js';

const nbsp = (s: string) => s.replace(/ /g, ' ');

describe('formatCLP', () => {
  it('usa punto de miles y sin decimales', () => {
    expect(nbsp(formatCLP(42_980))).toBe('$42.980');
    expect(nbsp(formatCLP(1_234_567))).toBe('$1.234.567');
  });

  it('redondea al peso', () => {
    expect(nbsp(formatCLP(999.6))).toBe('$1.000');
  });
});

describe('formatNumber', () => {
  it('usa coma decimal', () => {
    expect(formatNumber(21.6, 1)).toBe('21,6');
  });
});

describe('formatCompactCLP', () => {
  it('abrevia miles y millones', () => {
    expect(formatCompactCLP(640_000)).toBe('$640k');
    expect(formatCompactCLP(2_400_000)).toBe('$2,4M');
  });
});
