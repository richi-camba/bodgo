import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, quoteContract } from '@bodgo/core';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Microbodegas disponibles en Santiago',
  description:
    'Explora las microbodegas urbanas de la red BodGo: superficie libre, capacidad en m³ y precio por m² al mes, comuna por comuna.',
  alternates: { canonical: '/bodegas' },
};

type Search = { comuna?: string };

export default async function PublicWarehousesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { comuna } = await searchParams;
  const supabase = await createClient();

  const { data: all } = await supabase
    .from('warehouse_listings')
    .select('*')
    .order('rating', { ascending: false });

  const listings = (all ?? []).filter((w) => !comuna || w.comuna === comuna);
  const comunas = [...new Set((all ?? []).map((w) => w.comuna).filter(Boolean))].sort() as string[];

  const cheapest = Math.min(...(all ?? []).map((w) => w.price_per_m2 ?? Infinity));

  return (
    <>
      <section className="border-b border-line-100 bg-navy-950 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">
            La red, hoy
          </p>
          <h1 className="mt-4 max-w-2xl text-[34px] font-extrabold leading-[1.08] tracking-[-0.025em] text-white md:text-[46px]">
            {comuna ? `Microbodegas en ${comuna}` : 'Microbodegas disponibles'}
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-white/65">
            Espacios verificados, con superficie libre y precio a la vista. Mostramos el sector
            aproximado: la dirección exacta aparece al firmar el contrato.
            {Number.isFinite(cheapest) ? ` Desde ${formatCLP(cheapest)} por m² al mes.` : ''}
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------- comunas */}
      {comunas.length > 0 ? (
        <nav aria-label="Filtrar por comuna" className="border-b border-line-100 bg-white">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-4">
            <ComunaChip href="/bodegas" label="Todas" active={!comuna} />
            {comunas.map((c) => (
              <ComunaChip
                key={c}
                href={`/bodegas?comuna=${encodeURIComponent(c)}`}
                label={c}
                active={comuna === c}
              />
            ))}
          </div>
        </nav>
      ) : null}

      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p className="mb-5 text-[13.5px] font-semibold text-ink-500">
          {listings.length === 0
            ? 'Sin resultados'
            : `${listings.length} ${listings.length === 1 ? 'microbodega' : 'microbodegas'}`}
        </p>

        {listings.length === 0 ? (
          <EmptyState
            icon="buscar"
            title={comuna ? `Todavía no llegamos a ${comuna}` : 'Aún no hay espacios publicados'}
            body="La red está creciendo comuna por comuna. Déjanos tu correo y te avisamos cuando abramos cerca tuyo."
            action={<ButtonLink href="/#contacto">Avísenme</ButtonLink>}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((w) => {
              const available = Number(w.available_m2 ?? 0);
              const from = quoteContract(1, w.price_per_m2 ?? 0);

              return (
                <li key={w.id}>
                  <Link
                    href={`/bodegas/${w.id}`}
                    className="card flex h-full flex-col p-5 transition-shadow hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-[17px] font-extrabold tracking-tight text-navy-900">
                          {w.comuna}
                        </h2>
                        <p className="mt-0.5 truncate text-[12.5px] text-ink-400">
                          {w.sector_label}
                        </p>
                      </div>
                      <Badge tone="warning">★ {Number(w.rating ?? 0).toFixed(1)}</Badge>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-3 rounded-field bg-surface-50 p-3.5">
                      <Metric
                        label="Superficie libre"
                        value={available > 0 ? `${formatNumber(available, 1)} m²` : 'Completa'}
                      />
                      <Metric
                        label="Capacidad"
                        value={`${formatNumber(Number(w.capacity_m3 ?? 0), 1)} m³`}
                      />
                    </dl>

                    <div className="mt-auto pt-5">
                      <p className="text-[19px] font-extrabold leading-none text-navy-900 tabular-nums">
                        {formatCLP(w.price_per_m2 ?? 0)}
                        <span className="text-[12px] font-bold text-ink-400"> /m² al mes</span>
                      </p>
                      <p className="mt-1 text-[12px] text-ink-400">
                        Desde {formatCLP(from.total)}/mes con comisión incluida
                      </p>

                      {w.access_24_7 ? (
                        <Badge tone="success" className="mt-3">
                          Acceso 24/7
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-line-100 bg-surface-50 py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[32px]">
            ¿Encontraste la tuya?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-500">
            Crea tu cuenta para ver la disponibilidad exacta, hablar con el bodeguero y contratar.
            Es gratis y toma un minuto.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/registro" size="lg">
              Crear cuenta gratis
            </ButtonLink>
            <ButtonLink href="/registro?rol=bodeguero" size="lg" variant="secondary">
              Publicar mi espacio
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function ComunaChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`shrink-0 rounded-pill px-3.5 py-2 text-[13px] font-bold transition-colors ${
        active ? 'bg-navy-800 text-white' : 'bg-surface-100 text-ink-700 hover:bg-line-100'
      }`}
    >
      {label}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
