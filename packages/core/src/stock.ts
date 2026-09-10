import { LOW_STOCK_RATIO } from './constants';

/**
 * Estado del stock de un producto frente a su objetivo.
 *
 * `sin-objetivo` no es una advertencia: es que la PyME todavía no dijo cuánto
 * quiere tener, y sin ese número una barra o una alerta serían inventadas.
 */
export type StockStatus = 'agotado' | 'bajo' | 'ok' | 'sin-objetivo';

export function stockStatus(stock: number, target: number | null | undefined): StockStatus {
  if (stock <= 0) return 'agotado';
  if (target == null || target <= 0) return 'sin-objetivo';
  return stock <= target * LOW_STOCK_RATIO ? 'bajo' : 'ok';
}

/** Porcentaje del objetivo cubierto, tope 100 para que la barra no se desborde. */
export function stockPercent(stock: number, target: number | null | undefined): number {
  if (target == null || target <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, stock) / target) * 100));
}

/** Cuántas unidades faltan para llegar al objetivo. Cero si ya se alcanzó. */
export function unitsToTarget(stock: number, target: number | null | undefined): number {
  if (target == null || target <= 0) return 0;
  return Math.max(0, target - Math.max(0, stock));
}
