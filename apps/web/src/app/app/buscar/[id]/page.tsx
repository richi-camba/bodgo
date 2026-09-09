import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { formatCLP, formatNumber, pricePerM3 } from '@bodgo/core';
import { ContractForm } from './contract-form';

export const metadata: Metadata = { title: 'Microbodega' };

export default async function WarehouseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser('pyme');
  const supabase = await createClient();

  const [{ data: warehouse }, { data: cards }] = await Promise.all([
    supabase.from('warehouse_listings').select('*').eq('id', id).maybeSingle(),
    supabase.from('payment_methods').select('id, brand, last4, is_default').order('is_default', { ascending: false }),
  ]);

  if (!warehouse) notFound();

  const available = Number(warehouse.available_m2 ?? 0);
  const capacity = Number(warehouse.capacity_m3 ?? 0);
  const availableM3 = Math.round(capacity * (available / Math.max(Number(warehouse.total_m2 ?? 1), 1)) * 10) / 10;

  return (
    <div className="space-y-5">
      <Link href="/app/buscar" className="inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver al buscador
      </Link>

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-navy-900">
              {warehouse.comuna}
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-500">
              {warehouse.sector_label} · dirección exacta al contratar
            </p>
          </div>
          <div className="flex gap-2">
            <Badge tone="warning">★ {Number(warehouse.rating ?? 0).toFixed(1)}</Badge>
            {warehouse.access_24_7 ? <Badge tone="success">Acceso 24/7</Badge> : null}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Superficie libre" value={`${formatNumber(available, 1)} m²`} />
          <Metric label="Volumen apilable" value={`${formatNumber(availableM3, 1)} m³`} />
          <Metric label="Precio" value={`${formatCLP(warehouse.price_per_m2 ?? 0)} /m²`} />
          <Metric label="Por m³" value={`${formatCLP(pricePerM3(warehouse.price_per_m2 ?? 0))} /mes`} />
        </dl>

        {warehouse.description ? (
          <p className="mt-5 text-[14px] leading-relaxed text-ink-700">{warehouse.description}</p>
        ) : null}

        {warehouse.services?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {warehouse.services.map((s: string) => (
              <li key={s}>
                <Badge>{s}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex items-center gap-3 border-t border-line-100 pt-5">
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-800 text-[13px] font-extrabold text-white"
          >
            {(warehouse.bodeguero_name ?? '?')
              .split(' ')
              .slice(0, 2)
              .map((p: string) => p[0])
              .join('')}
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Bodeguero</p>
            <p className="text-[14px] font-bold text-navy-900">{warehouse.bodeguero_name}</p>
          </div>
        </div>
      </header>

      <section className="card p-6">
        <h2 className="text-[16px] font-extrabold text-navy-900">Cómo funciona tu envío</h2>
        <ol className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ink-700">
          <Step n={1}>
            Envías tu mercadería con el detalle de lo que mandas: SKUs y cantidades.
          </Step>
          <Step n={2}>
            El bodeguero <strong className="font-bold">confirma la recepción con foto</strong> al
            llegar. Lo recibido debe coincidir con lo enviado.
          </Step>
          <Step n={3}>
            Tu inventario se actualiza solo. Si hay diferencias, se abre un incidente de control de
            stock y el pago sigue retenido.
          </Step>
        </ol>

        <div className="mt-5 flex gap-3 rounded-field bg-brand-50 p-4">
          <span className="mt-0.5 text-brand-600">
            <Icon name="pagos" size={17} />
          </span>
          <p className="text-[13px] leading-relaxed text-navy-800">
            A ti se te cobra <strong className="font-bold">por adelantado</strong> al contratar. Al
            bodeguero le pagamos <strong className="font-bold">a fin de mes</strong> por los días
            efectivamente usados; el dinero queda en custodia mientras tanto.
          </p>
        </div>
      </section>

      <ContractForm
        warehouseId={warehouse.id!}
        comuna={warehouse.comuna ?? ''}
        pricePerM2={warehouse.price_per_m2 ?? 0}
        availableM2={available}
        cards={cards ?? []}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-surface-50 p-3">
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-[15px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[11px] font-extrabold text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
