import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { formatCLP, formatNumber, pricePerM3 } from '@bodgo/core';
import { ContractBar } from './contract-bar';
import { WriteToHost } from '@/components/app/write-to-host';
import { SectorMap } from '@/components/app/sector-map';

export const metadata: Metadata = { title: 'Microbodega' };

export default async function WarehouseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser('pyme');
  const supabase = await createClient();

  const [{ data: w }, { data: cards }] = await Promise.all([
    supabase.from('warehouse_listings').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('payment_methods')
      .select('id, brand, last4, is_default')
      .order('is_default', { ascending: false }),
  ]);

  if (!w) notFound();

  const disponible = Number(w.available_m2 ?? 0);
  const totalM3 = Number(w.capacity_m3 ?? 0);
  const totalM2 = Number(w.total_m2 ?? 1);
  const disponibleM3 = Math.round(totalM3 * (disponible / Math.max(totalM2, 1)) * 10) / 10;
  const lleno = disponible < 1;

  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:-mt-8">
      {/* ---------------------------------------------------------- portada */}
      <div className="relative h-56 bg-navy-800 sm:h-64">
        {w.photo_path ? (
          <Image src={w.photo_path} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center text-[72px] font-extrabold text-white/12"
          >
            {w.comuna?.trim()[0]?.toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-navy-950/25" />

        <Link
          href="/app/buscar"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-navy-950/70 text-white backdrop-blur-sm transition-colors hover:bg-navy-950"
        >
          <Icon name="volver" size={17} label="Volver al buscador" />
        </Link>

        <span className="absolute bottom-4 left-4 rounded-field bg-navy-950/80 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm">
          {lleno ? 'Sin espacio disponible' : `${formatNumber(disponible, 1)} m² disponibles`}
        </span>
      </div>

      {/* ------------------------------------------------------------ ficha */}
      <div className="relative -mt-5 rounded-t-[22px] bg-surface-50 px-4 pb-32 pt-6 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-extrabold tracking-tight text-navy-900">{w.comuna}</h1>
            <p className="mt-1 text-[13px] text-ink-500">
              {w.sector_label} · dirección exacta al contratar
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-pill bg-white px-2.5 py-1.5 text-[13px] font-bold text-navy-900 shadow-card">
            <span aria-hidden className="text-warning-600">★</span>
            {Number(w.rating ?? 0).toFixed(1)}
          </span>
        </div>

        {/* --------------------------------------------------- precio */}
        <div className="mt-5 flex items-end justify-between gap-4 rounded-card bg-navy-800 p-5 text-white">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
              Precio por m³
            </p>
            <p className="mt-1 text-[26px] font-extrabold leading-none tabular-nums">
              {formatCLP(pricePerM3(w.price_per_m2 ?? 0))}
              <span className="text-[13px] font-bold text-white/70">/mes</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">Disponible</p>
            <p className="mt-1 text-[20px] font-extrabold leading-none tabular-nums">
              {formatNumber(disponibleM3, 1)} m³
            </p>
            <p className="text-[11.5px] text-white/70">de {formatNumber(totalM3, 1)} m³ totales</p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2.5">
          <Dato label="Superficie libre" value={lleno ? '—' : `${formatNumber(disponible, 1)} m²`} />
          <Dato label="Precio" value={`${formatCLP(w.price_per_m2 ?? 0)}/m²`} />
          <Dato
            label="Recepción"
            value={w.reception_hours ?? (w.access_24_7 ? '24/7' : 'Consultar')}
          />
        </dl>

        {w.description ? (
          <p className="mt-5 text-[14.5px] leading-relaxed text-ink-700">{w.description}</p>
        ) : null}

        {w.services?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {w.services.map((s: string) => (
              <li key={s}>
                <Badge>{s}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {/* ------------------------------------------------- ubicación */}
        <section className="mt-6">
          <h2 className="text-[15px] font-extrabold text-navy-900">Ubicación aproximada</h2>
          {w.lat != null && w.lng != null ? (
            <SectorMap lat={Number(w.lat)} lng={Number(w.lng)} comuna={w.comuna ?? ''} />
          ) : (
            <p className="mt-3 rounded-card border border-line-200 bg-surface-25 p-4 text-[12.5px] text-ink-500">
              Este espacio todavía no tiene su ubicación cargada en el mapa.
            </p>
          )}
          <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-ink-500">
            <span className="mt-0.5 shrink-0 text-ink-400">
              <Icon name="ubicacion" size={14} />
            </span>
            Mostramos el sector con un margen de unos cien metros. Verás la calle y el número una
            vez confirmado el contrato.
          </p>
        </section>

        {/* ------------------------------------------------- bodeguero */}
        <div className="mt-5 flex items-center gap-3 rounded-card bg-white p-4">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[14px] font-extrabold text-white"
          >
            {(w.bodeguero_name ?? '?')
              .split(' ')
              .slice(0, 2)
              .map((p: string) => p[0])
              .join('')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">Bodeguero</p>
            <p className="truncate text-[14.5px] font-bold text-navy-900">{w.bodeguero_name}</p>
          </div>

          {w.bodeguero_id ? (
            <WriteToHost warehouseId={w.id!} bodegueroId={w.bodeguero_id} />
          ) : null}
        </div>

        <ContractBar
          warehouseId={w.id!}
          pricePerM2={w.price_per_m2 ?? 0}
          availableM2={disponible}
          tieneTarjeta={(cards ?? []).length > 0}
        />
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-white p-3">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-[14px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
