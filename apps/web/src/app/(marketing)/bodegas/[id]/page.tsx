import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, pricePerM3, quoteContract, usableCapacityM3 } from '@bodgo/core';

export const revalidate = 3600;

/** Ficha pública de una microbodega, para que se pueda indexar y compartir. */
async function loadListing(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('warehouse_listings').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const w = await loadListing(id);

  if (!w) return { title: 'Microbodega no encontrada' };

  return {
    title: `Microbodega en ${w.comuna} · ${formatNumber(Number(w.total_m2 ?? 0), 1)} m²`,
    description: `Microbodega urbana en ${w.comuna}, ${formatNumber(Number(w.capacity_m3 ?? 0), 1)} m³ de capacidad apilable, desde ${formatCLP(w.price_per_m2 ?? 0)} por m² al mes. Pago en custodia y seguro de contenido incluidos.`,
    alternates: { canonical: `/bodegas/${id}` },
  };
}

export default async function PublicWarehouseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const w = await loadListing(id);

  if (!w) notFound();

  const available = Number(w.available_m2 ?? 0);
  const full = available < 1;
  const suggested = Math.max(1, Math.min(4, Math.floor(available)));
  const quote = quoteContract(suggested, w.price_per_m2 ?? 0);

  return (
    <>
      <div className="mx-auto max-w-4xl px-5 pt-8">
        <Link
          href="/bodegas"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600 hover:underline"
        >
          <Icon name="volver" size={15} />
          Todas las microbodegas
        </Link>
      </div>

      <article className="mx-auto max-w-4xl space-y-5 px-5 py-6 pb-16">
        <header className="card p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900">
                Microbodega en {w.comuna}
              </h1>
              <p className="mt-1.5 text-[14px] text-ink-500">
                {w.sector_label} · anfitrión {w.bodeguero_name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="warning">★ {Number(w.rating ?? 0).toFixed(1)}</Badge>
              {w.access_24_7 ? <Badge tone="success">Acceso 24/7</Badge> : null}
              {full ? <Badge tone="danger">Sin espacio</Badge> : null}
            </div>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric
              label="Superficie libre"
              value={full ? '—' : `${formatNumber(available, 1)} m²`}
            />
            <Metric label="Capacidad total" value={`${formatNumber(Number(w.capacity_m3 ?? 0), 1)} m³`} />
            <Metric label="Precio" value={`${formatCLP(w.price_per_m2 ?? 0)} /m²`} />
            <Metric label="Por m³" value={`${formatCLP(pricePerM3(w.price_per_m2 ?? 0))} /mes`} />
          </dl>

          {w.description ? (
            <p className="mt-6 text-[15px] leading-relaxed text-ink-700">{w.description}</p>
          ) : null}

          {w.services?.length ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {w.services.map((s: string) => (
                <li key={s}>
                  <Badge>{s}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        {/* ------------------------------------------------------ cotización */}
        <section className="card p-7">
          <h2 className="text-[17px] font-extrabold text-navy-900">Cuánto costaría</h2>
          <p className="mt-1.5 text-[13.5px] text-ink-500">
            Ejemplo con {suggested} m², que equivalen a{' '}
            {formatNumber(usableCapacityM3(suggested), 1)} m³ apilables — unos{' '}
            {Math.round(usableCapacityM3(suggested) / 2)} pallets.
          </p>

          <dl className="mt-5 space-y-2.5 rounded-field bg-surface-50 p-4 text-[14px]">
            <Row label={`${suggested} m² × ${formatCLP(w.price_per_m2 ?? 0)}`} value={formatCLP(quote.base)} />
            <Row label="Comisión plataforma (8%)" value={formatCLP(quote.commission)} />
            <div className="flex items-center justify-between border-t border-line-200 pt-2.5">
              <dt className="font-extrabold text-navy-900">Total mensual</dt>
              <dd className="text-[19px] font-extrabold text-navy-900 tabular-nums">
                {formatCLP(quote.total)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex gap-3 rounded-field bg-brand-50 p-4">
            <span className="mt-0.5 text-brand-600">
              <Icon name="pagos" size={17} />
            </span>
            <p className="text-[13px] leading-relaxed text-navy-800">
              El pago queda en custodia. Al bodeguero se le libera recién cuando confirma que
              recibió tu mercadería y que coincide con lo que declaraste.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------ ubicación */}
        <section className="card p-7">
          <h2 className="text-[17px] font-extrabold text-navy-900">Ubicación</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
            {w.sector_label}, {w.region}.{' '}
            {w.address_reference ? `${w.address_reference}. ` : ''}
            Mostramos sólo el sector aproximado: la calle y el número aparecen una vez firmado el
            contrato.
          </p>
        </section>

        <section className="rounded-card bg-navy-800 p-7 text-center text-white">
          <h2 className="text-[21px] font-extrabold tracking-tight">
            {full ? 'Esta bodega está completa' : `¿Te sirve este espacio en ${w.comuna}?`}
          </h2>
          <p className="mx-auto mt-2.5 max-w-md text-[14.5px] leading-relaxed text-white/65">
            {full
              ? 'Crea tu cuenta y te avisamos apenas se libere superficie acá, o busca otra en la misma zona.'
              : 'Crea tu cuenta para ver la disponibilidad al día, escribirle al bodeguero y contratar los metros que necesites.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/registro"
              size="lg"
              variant="secondary"
              className="border-transparent bg-white text-navy-800 hover:bg-white/90"
            >
              Crear cuenta gratis
            </ButtonLink>
            <ButtonLink
              href={`/bodegas?comuna=${encodeURIComponent(w.comuna ?? '')}`}
              size="lg"
              variant="secondary"
              className="border-white/25 bg-white/10 text-white hover:bg-white/15"
            >
              Ver otras en {w.comuna}
            </ButtonLink>
          </div>
        </section>
      </article>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-surface-50 p-3.5">
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-[15px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-bold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
