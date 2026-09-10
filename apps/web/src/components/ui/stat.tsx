import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/icon';

/**
 * Tarjeta de métrica.
 *
 * El prototipo usa dos órdenes distintos y los dos son deliberados: en la
 * portada de la PyME el número va primero, porque es lo que se mira de un
 * vistazo; en el backoffice y en la app del bodeguero va la etiqueta primero,
 * porque ahí hay cuatro cifras juntas y hace falta saber qué es cada una antes
 * de leerlas.
 */
export function Stat({
  value,
  label,
  delta,
  tone = 'neutral',
  orden = 'valor-primero',
}: {
  value: ReactNode;
  label: string;
  delta?: string;
  tone?: 'neutral' | 'success' | 'danger';
  orden?: 'valor-primero' | 'etiqueta-primero';
}) {
  const valor = (
    <p className="text-[24px] font-extrabold leading-none tracking-tight text-navy-900 tabular-nums">
      {value}
    </p>
  );
  const etiqueta = <p className="text-[12px] text-ink-500">{label}</p>;

  return (
    <div className="card p-4">
      {orden === 'valor-primero' ? (
        <>
          {valor}
          <div className="mt-1.5">{etiqueta}</div>
        </>
      ) : (
        <>
          {etiqueta}
          <div className="mt-2">{valor}</div>
        </>
      )}
      {delta ? (
        <p
          className={`mt-2 text-[11.5px] font-bold ${
            tone === 'success'
              ? 'text-success-700'
              : tone === 'danger'
                ? 'text-danger-700'
                : 'text-ink-500'
          }`}
        >
          {delta}
        </p>
      ) : null}
    </div>
  );
}

/** Estado vacío. Dice qué falta y qué hacer, no sólo "sin resultados". */
export function EmptyState({
  title,
  body,
  action,
  icon = 'sinResultados',
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-ink-400">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="mt-4 text-[15.5px] font-extrabold text-navy-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-500">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Título de sección dentro de una página de la app. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13.5px] text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
