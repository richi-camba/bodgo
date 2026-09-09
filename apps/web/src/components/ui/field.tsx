import type { ComponentProps, ReactNode } from 'react';

const INPUT =
  'h-12 w-full rounded-field border border-line-200 bg-white px-3.5 text-[14.5px] text-navy-900 ' +
  'placeholder:text-ink-400 transition-colors focus:border-brand-600 focus:outline-none ' +
  'focus:ring-4 focus:ring-brand-600/12 disabled:bg-surface-50 disabled:text-ink-400';

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[12.5px] font-bold text-ink-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] font-semibold text-danger-600">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = '', ...rest }: ComponentProps<'input'>) {
  return <input className={`${INPUT} ${className}`} {...rest} />;
}

export function Select({ className = '', ...rest }: ComponentProps<'select'>) {
  return <select className={`${INPUT} ${className}`} {...rest} />;
}

export function Textarea({ className = '', ...rest }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={`${INPUT} min-h-24 resize-y py-3 leading-relaxed ${className}`}
      {...rest}
    />
  );
}

/** Aviso de error de formulario, con rol de alerta para lectores de pantalla. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-field border border-danger-600/25 bg-danger-50 px-3.5 py-3 text-[13px] font-semibold text-danger-600"
    >
      {children}
    </p>
  );
}
