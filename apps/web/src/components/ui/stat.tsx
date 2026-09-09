import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/icon';

/** Tarjeta de métrica: el número grande primero, la etiqueta debajo. */
export function Stat({
  value,
  label,
  delta,
  tone = 'neutral',
}: {
  value: ReactNode;
  label: string;
  delta?: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  return (
    <div className="card p-4">
      <p className="text-[24px] font-extrabold leading-none tracking-tight text-navy-900 tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-ink-500">{label}</p>
      {delta ? (
        <p
          className={`mt-2 text-[11.5px] font-bold ${
            tone === 'success' ? 'text-success-600' : tone === 'danger' ? 'text-danger-600' : 'text-ink-400'
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
