import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Envíos a bodega' };

const TONE = {
  draft: 'neutral',
  ready: 'brand',
  in_transit: 'brand',
  received: 'success',
  discrepancy: 'danger',
} as const;

export default async function ShipmentsPage() {
  const supabase = await createClient();

  const { data: shipments } = await supabase
    .from('shipments')
    .select(
      'id, code, description, packages_count, declared_volume_m3, status, created_at, warehouses(comuna)',
    )
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Envíos a bodega"
        subtitle="Mercadería que mandas a tus microbodegas, con su manifiesto."
        action={<ButtonLink href="/app/despachos/nuevo" size="sm">Nuevo envío</ButtonLink>}
      />

      {!shipments?.length ? (
        <EmptyState
          icon="🚚"
          title="Todavía no has enviado mercadería"
          body="Arma un envío con el detalle de lo que mandas. El bodeguero cuenta contra esa lista al recibir, y eso es lo que te protege si algo no llega."
          action={<ButtonLink href="/app/despachos/nuevo">Preparar un envío</ButtonLink>}
        />
      ) : (
        <ul className="space-y-2.5">
          {shipments.map((s) => (
            <li key={s.id}>
              <Link href={`/app/despachos/${s.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-extrabold text-navy-900">{s.code}</h2>
                    <Badge tone={TONE[s.status]}>{LABELS.shipmentStatus[s.status]}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-400">
                    {s.description} · {s.warehouses?.comuna}
                  </p>
                </div>

                <div className="text-right text-[12.5px] text-ink-500">
                  <p className="font-bold text-navy-900">{s.packages_count} bultos</p>
                  <p>{formatNumber(Number(s.declared_volume_m3 ?? 0), 2)} m³</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
