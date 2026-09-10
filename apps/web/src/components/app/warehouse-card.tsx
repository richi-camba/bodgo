import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';
import { formatCLP, formatNumber } from '@bodgo/core';

export type Listing = {
  id: string;
  comuna: string;
  sector: string | null;
  bodeguero: string | null;
  rating: number;
  availableM2: number;
  totalM2: number;
  occupancyPct: number;
  pricePerM2: number;
  access247: boolean;
  photo: string | null;
  /** Distancia a la demanda de la PyME, cuando se puede calcular. */
  distanciaKm?: number | null;
};

/**
 * Ficha horizontal de microbodega: miniatura a la izquierda, datos a la
 * derecha y la barra de ocupación abajo, como en el prototipo.
 *
 * La ocupación va en barra y no en número solo porque «65%» no dice nada por
 * sí mismo; la barra deja ver de un vistazo cuánto queda.
 */
export function WarehouseCard({ listing, href }: { listing: Listing; href: string }) {
  const lleno = listing.availableM2 < 1;

  return (
    <Link
      href={href}
      className="card flex gap-3.5 overflow-hidden p-3 transition-shadow hover:shadow-card"
    >
      <Thumb listing={listing} />

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-extrabold tracking-tight text-navy-900">
            {listing.comuna}
          </h3>
          <span className="flex shrink-0 items-center gap-0.5 text-[12.5px] font-bold text-navy-900">
            <span aria-hidden className="text-warning-600">
              ★
            </span>
            {listing.rating.toFixed(1)}
          </span>
        </div>

        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-ink-500">
          <Icon name="ubicacion" size={12} className="text-ink-400" />
          {listing.sector ?? listing.comuna}
        </p>

        <p className="truncate text-[11.5px] text-ink-400">
          {listing.distanciaKm != null ? `A ${formatNumber(listing.distanciaKm, 1)} km · ` : ''}
          {listing.bodeguero}
        </p>

        {/* -------------------------------------------------- ocupación */}
        <div className="mt-2.5 flex items-center gap-2">
          <div
            role="progressbar"
            aria-valuenow={listing.occupancyPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Ocupación de la bodega en ${listing.comuna}`}
            className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line-100"
          >
            <div
              className={`h-full rounded-pill ${lleno ? 'bg-danger-600' : 'bg-success-600'}`}
              style={{ width: `${Math.min(100, listing.occupancyPct)}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-ink-500">
            {listing.occupancyPct}% ocup.
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-[16px] font-extrabold leading-none text-navy-900 tabular-nums">
            {formatCLP(listing.pricePerM2)}
            <span className="text-[11px] font-bold text-ink-500"> /m² al mes</span>
          </p>
          {listing.access247 ? (
            <span className="shrink-0 rounded-pill bg-success-50 px-2 py-0.5 text-[10px] font-bold text-success-700">
              24/7
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/**
 * Miniatura del espacio.
 *
 * No todos los anfitriones suben foto, así que el caso sin imagen tiene su
 * propio diseño en vez de un hueco gris: la inicial de la comuna sobre el
 * navy de la marca.
 */
function Thumb({ listing }: { listing: Listing }) {
  const libres = listing.availableM2 < 1 ? 'Completa' : `${formatNumber(listing.availableM2, 0)} m²`;

  return (
    <span className="relative block h-[86px] w-[86px] shrink-0 overflow-hidden rounded-field bg-navy-800">
      {listing.photo ? (
        <Image
          src={listing.photo}
          alt=""
          fill
          sizes="86px"
          className="object-cover"
        />
      ) : (
        /* La inicial es decoración: la comuna ya está escrita al lado, así que
           repetirla para un lector de pantalla sería ruido — y por lo mismo no
           le corresponde el mínimo de contraste de un texto. */
        <span
          aria-hidden
          className="flex h-full w-full items-center justify-center text-[26px] font-extrabold text-white/25"
        >
          {listing.comuna.trim()[0]?.toUpperCase()}
        </span>
      )}

      <span className="absolute left-1 top-1 rounded-[6px] bg-navy-950/85 px-1.5 py-0.5 text-[9.5px] font-bold text-white backdrop-blur-sm">
        {libres}
      </span>
    </span>
  );
}
