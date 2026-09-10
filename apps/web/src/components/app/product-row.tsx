import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { formatNumber, stockPercent, stockStatus } from '@bodgo/core';

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  targetStock: number | null;
  /** Unidades visibles: todas, o las de la bodega filtrada. */
  stock: number;
  /** Qué se lee bajo el SKU: la categoría, o la posición en la bodega filtrada. */
  detalle: string;
  bodegas: number;
};

/**
 * Fila de producto del inventario.
 *
 * La barra mide contra el stock objetivo del producto. Sin objetivo no hay
 * barra: 40 unidades es mucho o poco según qué se venda, y una barra sin techo
 * dibuja una precisión que no existe.
 */
export function ProductCard({ producto }: { producto: ProductRow }) {
  const estado = stockStatus(producto.stock, producto.targetStock);
  const porcentaje = stockPercent(producto.stock, producto.targetStock);

  const color =
    estado === 'agotado' ? 'text-danger-700'
    : estado === 'bajo' ? 'text-warning-700'
    : estado === 'ok' ? 'text-success-700'
    : 'text-navy-800';

  const barra =
    estado === 'agotado' ? 'bg-danger-600'
    : estado === 'bajo' ? 'bg-warning-600'
    : 'bg-success-600';

  return (
    <Link
      href={`/app/inventario/${producto.id}`}
      className="block rounded-[16px] border border-line-100 bg-white p-3.5 transition-colors hover:border-navy-800"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-navy-900">{producto.name}</p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-ink-500">
            {producto.sku} · {producto.detalle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className={`text-[17px] font-extrabold leading-none tabular-nums ${color}`}>
              {formatNumber(producto.stock)}
            </p>
            <p className="mt-1 text-[10px] text-ink-500">unidades</p>
          </div>
          <span className="text-line-300">
            <Icon name="siguiente" size={16} />
          </span>
        </div>
      </div>

      {producto.targetStock ? (
        <div className="mt-3 flex items-center gap-2">
          <div
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${producto.stock} de ${producto.targetStock} unidades objetivo`}
            className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line-100"
          >
            <div className={`h-full rounded-pill ${barra}`} style={{ width: `${porcentaje}%` }} />
          </div>
          {producto.bodegas > 1 ? (
            <span className="rounded-[6px] bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
              {producto.bodegas} bodegas
            </span>
          ) : null}
        </div>
      ) : producto.bodegas > 1 ? (
        <p className="mt-2.5">
          <span className="rounded-[6px] bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
            {producto.bodegas} bodegas
          </span>
        </p>
      ) : null}
    </Link>
  );
}
