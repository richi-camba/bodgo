import type { ReactNode } from 'react';

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'navy';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-100 text-ink-500',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  navy: 'bg-navy-800 text-white',
};

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
