/**
 * Pastilla de filtro.
 *
 * Del prototipo: activa en navy sólido, apagada en gris. Vive suelta porque
 * el buscador de bodegas y el inventario filtran con la misma pieza, y dos
 * copias se desincronizan a la primera.
 */
export function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`shrink-0 rounded-pill px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
        activo ? 'bg-navy-800 text-white' : 'bg-surface-100 text-ink-700 hover:bg-line-100'
      }`}
    >
      {children}
    </button>
  );
}
