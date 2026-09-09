type Props = {
  /** Alto del isotipo en px. El texto escala con él. */
  size?: number;
  /** `light` para fondos oscuros, `dark` para fondos claros. */
  tone?: 'light' | 'dark';
  /** Sólo el isotipo, sin la palabra. */
  markOnly?: boolean;
  className?: string;
};

/**
 * Isotipo de BodGo: un bulto visto en isometría con la marca de seguimiento al
 * centro. El "Go" siempre va en el azul de acento.
 */
export function Logo({ size = 22, tone = 'dark', markOnly = false, className = '' }: Props) {
  const markFill = tone === 'light' ? '#fff' : '#16365A';
  const dotFill = tone === 'light' ? '#16365A' : '#fff';
  const wordColor = tone === 'light' ? '#fff' : '#16365A';
  const goColor = tone === 'light' ? '#7FB3E6' : '#2C72B7';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label={markOnly ? 'BodGo' : undefined}
        aria-hidden={markOnly ? undefined : true}
        className="shrink-0"
      >
        <path d="M12 1.8l8.8 5.1v10.2L12 22.2l-8.8-5.1V6.9z" fill={markFill} />
        <circle cx="12" cy="12" r="3.1" fill={dotFill} />
      </svg>
      {markOnly ? null : (
        <span
          style={{ color: wordColor, fontSize: size * 0.95, letterSpacing: '-0.5px' }}
          className="font-extrabold leading-none"
        >
          Bod<span style={{ color: goColor }}>Go</span>
        </span>
      )}
    </span>
  );
}
