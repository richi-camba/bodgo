import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/icon';

/** Rótulo de sección del prototipo: mayúsculas chicas sobre la tarjeta. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 mt-5 text-[12px] font-bold uppercase tracking-[.04em] text-ink-500">
      {children}
    </h2>
  );
}

/** Tarjeta con filas divididas, como las listas de datos del perfil. */
export function RowCard({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-line-100 overflow-hidden rounded-[16px] border border-line-100 bg-white">
      {children}
    </div>
  );
}

/** Fila de dato: etiqueta a la izquierda, valor a la derecha. */
export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <span className="shrink-0 text-[13px] text-ink-500">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-semibold text-navy-900">
        {value}
      </span>
    </div>
  );
}

/** Fila que lleva a otra pantalla. */
export function LinkRow({
  href,
  icon,
  children,
}: {
  href: string;
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-25">
      <span className="shrink-0 text-ink-500">
        <Icon name={icon} size={17} />
      </span>
      <span className="flex-1 text-[13px] font-semibold text-navy-900">{children}</span>
      <span aria-hidden className="shrink-0 text-line-300">
        <Icon name="siguiente" size={14} />
      </span>
    </Link>
  );
}
