import type { Metadata } from 'next';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { WarehouseCard, type Listing } from '@/components/app/warehouse-card';
import { WarehouseMap, type MapPin } from '@/components/app/warehouse-map';
import { ViewToggle } from './view-toggle';
import { createClient } from '@/lib/supabase/server';
import { COMUNA_CENTROIDS, drivingDistanceKm } from '@bodgo/core';
import { SearchControls } from './controls';

export const metadata: Metadata = { title: 'Buscar microbodega' };

type Search = { q?: string; comuna?: string; max?: string; orden?: string; vista?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: all }, { data: pyme }] = await Promise.all([
    supabase.from('warehouse_listings').select('*'),
    supabase.from('pyme_profiles').select('comuna').single(),
  ]);

  const comunas = [...new Set((all ?? []).map((w) => w.comuna).filter(Boolean))].sort() as string[];

  // La distancia se mide contra la comuna de la PyME: es «cerca de mi
  // demanda», que es como piensa quien busca dónde guardar.
  const origen = pyme?.comuna ?? null;

  let listings = (all ?? []).map((w) => ({
    fila: w,
    distancia:
      origen && w.lat != null && w.lng != null
        ? drivingDistanceKm({ lat: w.lat, lng: w.lng }, origen)
        : null,
  }));

  const texto = params.q?.trim().toLowerCase();
  if (texto) {
    listings = listings.filter((l) =>
      [l.fila.comuna, l.fila.sector_label, l.fila.bodeguero_name]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(texto)),
    );
  }
  if (params.comuna) listings = listings.filter((l) => l.fila.comuna === params.comuna);
  if (params.max) listings = listings.filter((l) => (l.fila.price_per_m2 ?? 0) <= Number(params.max));

  listings.sort((a, b) => {
    switch (params.orden) {
      case 'precio':
        return (a.fila.price_per_m2 ?? 0) - (b.fila.price_per_m2 ?? 0);
      case 'espacio':
        return Number(b.fila.available_m2 ?? 0) - Number(a.fila.available_m2 ?? 0);
      case 'cercania':
        return (a.distancia ?? Infinity) - (b.distancia ?? Infinity);
      default:
        return Number(b.fila.rating ?? 0) - Number(a.fila.rating ?? 0);
    }
  });

  const enMapa = params.vista === 'mapa';

  const pins: MapPin[] = listings
    .filter((l) => l.fila.lat != null && l.fila.lng != null)
    .map((l) => ({
      id: l.fila.id!,
      comuna: l.fila.comuna ?? '',
      lat: Number(l.fila.lat),
      lng: Number(l.fila.lng),
      pricePerM2: l.fila.price_per_m2 ?? 0,
      availableM2: Number(l.fila.available_m2 ?? 0),
    }));

  // El punto de referencia es la comuna de la PyME: «cerca» significa cerca
  // de su demanda, no del centro de Santiago.
  const centroide = origen ? COMUNA_CENTROIDS[origen] : undefined;
  const centro = centroide ? { ...centroide, label: origen! } : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Encuentra tu microbodega"
        subtitle="Espacios verificados. La dirección exacta se muestra al contratar."
      />

      <SearchControls comunas={comunas} tieneOrigen={origen != null} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-500">
          {listings.length === 0
            ? 'Sin resultados'
            : `${listings.length} ${listings.length === 1 ? 'microbodega disponible' : 'microbodegas disponibles'}`}
        </p>
        <ViewToggle mapa={enMapa} />
      </div>

      {enMapa ? (
        <WarehouseMap pins={pins} sinUbicacion={listings.length - pins.length} origen={centro} />
      ) : null}

      {enMapa ? null : listings.length === 0 ? (
        <EmptyState
          icon="buscar"
          title="No encontramos microbodegas con esos filtros"
          body="Prueba con otra comuna, sube el precio máximo o borra la búsqueda."
        />
      ) : (
        <ul className="space-y-2.5">
          {listings.map(({ fila, distancia }) => {
            const listing: Listing = {
              id: fila.id!,
              comuna: fila.comuna ?? '',
              sector: fila.sector_label,
              bodeguero: fila.bodeguero_name,
              rating: Number(fila.rating ?? 0),
              availableM2: Number(fila.available_m2 ?? 0),
              totalM2: Number(fila.total_m2 ?? 0),
              occupancyPct: fila.occupancy_pct ?? 0,
              pricePerM2: fila.price_per_m2 ?? 0,
              access247: fila.access_24_7 ?? false,
              photo: fila.photo_path,
              distanciaKm: distancia,
            };

            return (
              <li key={fila.id}>
                <WarehouseCard listing={listing} href={`/app/buscar/${fila.id}`} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
