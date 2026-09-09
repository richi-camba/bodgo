import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Recepciones' };

const TONE = {
  draft: 'neutral',
  ready: 'neutral',
  in_transit: 'brand',
  received: 'success',
  discrepancy: 'danger',
} as const;

export default async function ReceptionsPage() {
  const supabase = await createClient();

  const { data: shipments } = await supabase
    .from('shipments')
    .select(
      'id, code, description, packages_count, declared_volume_m3, received_volume_m3, capacity_m3, status, dispatched_at, received_at, pyme_id, warehouses(comuna)',
    )
    .in('status', ['in_transit', 'received', 'discrepancy'])
    .order('dispatched_at', { ascending: false });

  const pymeIds = [...new Set((shipments ?? []).map((s) => s.pyme_id))];
  const { data: pymes } = pymeIds.length
    ? await supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', pymeIds)
    : { data: [] };
  const businessById = new Map((pymes ?? []).map((p) => [p.profile_id, p.business_name]));

  const pending = (shipments ?? []).filter((s) => s.status === 'in_transit');
  const done = (shipments ?? []).filter((s) => s.status !== 'in_transit');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recepciones"
        subtitle="Cuenta y mide contra el manifiesto. Si no calza, se abre una discrepancia y se avisa a la PyME."
      />

      <section>
        <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">
          Por verificar {pending.length > 0 ? `(${pending.length})` : ''}
        </h2>

        {pending.length === 0 ? (
          <EmptyState
            icon="📥"
            title="No hay mercadería en camino"
            body="Cuando una PyME despache un envío a tus espacios, aparecerá acá para que lo cuentes contra el manifiesto."
          />
        ) : (
          <ul className="space-y-2.5">
            {pending.map((s) => (
              <li key={s.id}>
                <Link href={`/bodeguero/recepciones/${s.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-extrabold text-navy-900">
                        {businessById.get(s.pyme_id) ?? 'PyME'}
                      </h3>
                      <Badge tone="brand">{s.code}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-400">
                      {s.description} · {s.warehouses?.comuna}
                    </p>
                  </div>

                  <div className="text-right text-[12.5px] text-ink-500">
                    <p className="font-bold text-navy-900">{s.packages_count} bultos</p>
                    <p>
                      {formatNumber(Number(s.declared_volume_m3 ?? 0), 2)} de{' '}
                      {formatNumber(Number(s.capacity_m3 ?? 0), 1)} m³
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">Historial</h2>
          <ul className="space-y-2.5">
            {done.map((s) => (
              <li key={s.id}>
                <Link href={`/bodeguero/recepciones/${s.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-navy-900">
                        {businessById.get(s.pyme_id) ?? 'PyME'}
                      </h3>
                      <Badge tone={TONE[s.status]}>{LABELS.shipmentStatus[s.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-400">
                      {s.code} · recibido el{' '}
                      {s.received_at ? new Date(s.received_at).toLocaleDateString('es-CL') : '—'}
                    </p>
                  </div>
                  <span className="text-[12.5px] text-ink-500 tabular-nums">
                    {formatNumber(Number(s.received_volume_m3 ?? 0), 2)} m³
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
