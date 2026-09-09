/** Formato de moneda chilena. El peso no usa decimales. */

const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const PLAIN = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/** `formatCLP(42980)` → `"$42.980"` */
export function formatCLP(amount: number): string {
  return CLP.format(Math.round(amount));
}

/** Igual que `formatCLP` pero sin el signo: `"42.980"`. */
export function formatNumber(value: number, decimals = 0): string {
  if (decimals > 0) {
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  return PLAIN.format(Math.round(value));
}

/** Formato compacto para tarjetas de métricas: `"$640k"`. */
export function formatCompactCLP(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${formatNumber(amount / 1_000_000, 1).replace(',0', '')}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${Math.round(amount / 1_000)}k`;
  }
  return formatCLP(amount);
}
