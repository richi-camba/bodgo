import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/icon';

/**
 * Tarjeta de tarea del bodeguero.
 *
 * Medidas del prototipo: esquina 18, borde de línea, y adentro una caja gris
 * de esquina 12 con el detalle de lo que llega. Esa caja es la que hace que
 * la tarjeta se lea de un vistazo: separa «qué hay que hacer» de «qué es».
 */
export function TaskCard({
  titulo,
  etiqueta,
  tono = 'brand',
  meta,
  detalle,
  accion,
}: {
  titulo: string;
  etiqueta: string;
  tono?: 'brand' | 'warning' | 'success';
  meta: ReactNode;
  detalle?: { icon: IconName; titulo: string; texto: string };
  accion: ReactNode;
}) {
  const TONOS = {
    brand: 'bg-brand-100 text-brand-700',
    warning: 'bg-warning-50 text-warning-700',
    success: 'bg-success-50 text-success-700',
  };

  return (
    <article className="rounded-[18px] border border-line-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15.5px] font-extrabold tracking-tight text-navy-900">{titulo}</h3>
        <span
          className={`shrink-0 rounded-[7px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TONOS[tono]}`}
        >
          {etiqueta}
        </span>
      </div>

      <div className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{meta}</div>

      {detalle ? (
        <div className="mt-3 flex items-center gap-3 rounded-[12px] bg-surface-50 px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white text-brand-600">
            <Icon name={detalle.icon} size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-navy-900">{detalle.titulo}</p>
            <p className="truncate text-[11.5px] text-ink-500">{detalle.texto}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-3.5">{accion}</div>
    </article>
  );
}
