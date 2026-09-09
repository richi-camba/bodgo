/**
 * Marcador de contenido en carga.
 *
 * Repite la forma de lo que viene —una tarjeta, una fila, un número— para que
 * la página no salte al llegar los datos. La animación se apaga sola si el
 * sistema pide movimiento reducido (ver globals.css).
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[8px] bg-line-100 ${className}`} />;
}

/** Fila de tarjetas de métrica. */
export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-3 ${count === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="mt-2.5 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Lista de tarjetas. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="card flex items-center gap-4 p-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-56" />
          </div>
          <Skeleton className="h-6 w-20" />
        </li>
      ))}
    </ul>
  );
}

/** Cabecera de página. */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-5">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mt-2 h-3.5 w-72" />
    </div>
  );
}
