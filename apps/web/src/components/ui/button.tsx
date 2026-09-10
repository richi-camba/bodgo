import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'tarjeta';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-navy-800 text-white hover:bg-navy-950 active:bg-navy-950 disabled:bg-line-300 disabled:text-ink-700',
  // Azul de marca: la acción que crea algo nuevo, frente al navy que avanza
  // el flujo en curso.
  brand:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 disabled:bg-line-300 disabled:text-ink-700',
  secondary:
    'bg-white text-navy-800 border border-line-200 hover:border-navy-800 hover:bg-surface-25 disabled:text-ink-400 disabled:border-line-100',
  ghost: 'bg-transparent text-navy-800 hover:bg-brand-50 disabled:text-ink-400',
  danger: 'bg-danger-700 text-white hover:brightness-95 disabled:bg-line-300 disabled:text-ink-700',
  success: 'bg-success-600 text-white hover:bg-success-700 disabled:bg-line-300',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-[10px]',
  md: 'h-11 px-5 text-sm rounded-field',
  lg: 'h-13 px-6 text-[15px] rounded-field',
  // Acción de tarjeta: 37px de alto y 14px de texto, como en el prototipo.
  tarjeta: 'h-[37px] px-4 text-[14px] rounded-[12px]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-bold transition-colors ' +
  'disabled:cursor-not-allowed select-none';

type Props = {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  className = '',
  ...rest
}: Props & Omit<ComponentProps<'button'>, keyof Props>) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  full,
  className = '',
  ...rest
}: Props & Omit<ComponentProps<typeof Link>, keyof Props>) {
  return (
    <Link
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}
