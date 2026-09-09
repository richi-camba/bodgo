import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, pricePerM3, quoteContract } from '@bodgo/core';
import { Filters } from './filters';

export const metadata: Metadata = { title: 'Buscar microbodega' };

type Search = { comuna?: string; max?: string; min_m2?: string; orden?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from('warehouse_listings').select('*');

  if (params.comuna) query = query.eq('comuna', params.comuna);
  if (params.max) query = query.lte('price_per_m2', Number(params.max));

  const { data: all } = await query;

  // El filtro por superficie libre se hace acá y no en la consulta:
  // `available_m2` es una columna calculada de la vista y PostgREST no la
  // puede filtrar con un índice de todos modos.
  const minM2 = params.min_m2 ? Number(params.min_m2) : 0;
  let listings = (all ?? []).filter((w) => Number(w.available_m2 ?? 0) >= minM2);

  listings = listings.sort((a, b) => {
    if (params.orden === 'precio') return (a.price_per_m2 ?? 0) - (b.price_per_m2 ?? 0);
    if (params.orden === 'espacio') return Number(b.available_m2 ?? 0) - Number(a.available_m2 ?? 0);
    return Number(b.rating ?? 0) - Number(a.rating ?? 0);
  });

  const comunas = [...new Set((all ?? []).map((w) => w.comuna).filter(Boolean))].sort() as string[];

  return (
    <div>
      <PageHeader
        title="Encuentra tu microbodega"
        subtitle="Espacios verificados cerca de tu demanda. La dirección exacta se muestra al contratar."
      />

      <Filters comunas={comunas} />

      <p className="mb-3 mt-5 text-[13px] font-semibold text-ink-500">
        {listings.length === 0
          ? 'Sin resultados'
          : `${listings.length} ${listings.length === 1 ? 'microbodega' : 'microbodegas'}`}
      </p>

      {listings.length === 0 ? (
        <EmptyState
          icon="buscar"
          title="No encontramos microbodegas con esos filtros"
          body="Prueba con otra comuna, sube el precio máximo o baja la superficie mínima."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {listings.map((w) => {
            const available = Number(w.available_m2 ?? 0);
            const quote = quoteContract(Math.min(4, Math.max(1, Math.floor(available))), w.price_per_m2 ?? 0);

            return (
              <li key={w.id}>
                <Link
                  href={`/app/buscar/${w.id}`}
                  className="card flex h-full flex-col p-4 transition-shadow hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[16px] font-extrabold tracking-tight text-navy-900">
                        {w.comuna}
                      </h2>
                      <p className="mt-0.5 text-[12.5px] text-ink-400">
                        {w.sector_label} · {w.bodeguero_name}
                      </p>
                    </div>
                    <Badge tone="warning">★ {Number(w.rating ?? 0).toFixed(1)}</Badge>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 rounded-field bg-surface-50 p-3">
                    <Metric label="Libres" value={`${formatNumber(available, 1)} m²`} />
                    <Metric label="Capacidad" value={`${formatNumber(Number(w.capacity_m3 ?? 0), 1)} m³`} />
                    <Metric label="Ocupación" value={`${w.occupancy_pct ?? 0}%`} />
                  </dl>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                    <div>
                      <p className="text-[17px] font-extrabold text-navy-900 tabular-nums">
                        {formatCLP(w.price_per_m2 ?? 0)}
                        <span className="text-[11.5px] font-bold text-ink-400"> /m² al mes</span>
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-ink-400">
                        ≈ {formatCLP(pricePerM3(w.price_per_m2 ?? 0))} por m³ · desde{' '}
                        {formatCLP(quote.total)}/mes
                      </p>
                    </div>
                    {w.access_24_7 ? <Badge tone="success">24/7</Badge> : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
