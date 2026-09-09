import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Discrepancias' };

export default async function DiscrepanciesPage() {
  const supabase = await createClient();

  const { data: discrepancies } = await supabase
    .from('discrepancies')
    .select('*, shipments(code, pyme_id, warehouse_id, warehouses(comuna))')
    .order('created_at', { ascending: false });

  const pymeIds = [...new Set((discrepancies ?? []).map((d) => d.shipments?.pyme_id).filter(Boolean))] as string[];
  const { data: pymes } = pymeIds.length
    ? await supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', pymeIds)
    : { data: [] };
  const businessById = new Map((pymes ?? []).map((p) => [p.profile_id, p.business_name]));

  const open = (discrepancies ?? []).filter((d) => d.status !== 'resolved' && d.status !== 'accepted');
  const unitsLost = (discrepancies ?? []).reduce((s, d) => s + d.units_short, 0);
  const volumeCases = (discrepancies ?? []).filter((d) => d.type !== 'units').length;

  // Tasa de coincidencia sobre el total de recepciones cerradas.
  const { count: receivedCount } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['received', 'discrepancy']);

  const matchRate = receivedCount
    ? Math.round(((receivedCount - (discrepancies?.length ?? 0)) / receivedCount) * 100)
    : 100;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Discrepancias"
        subtitle="El bodeguero cuenta y mide contra el manifiesto al recibir. Si no calza, el caso aterriza acá."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={open.length} label="Abiertas" tone={open.length > 0 ? 'danger' : 'success'} />
        <Stat value={formatNumber(unitsLost)} label="Unidades faltantes" />
        <Stat value={volumeCases} label="Excesos de volumen" />
        <Stat value={`${matchRate}%`} label="Tasa de coincidencia" tone="success" />
      </div>

      {!discrepancies?.length ? (
        <EmptyState
          icon="✓"
          title="Sin diferencias registradas"
          body="Todas las recepciones cuadraron con su manifiesto."
        />
      ) : (
        <ul className="space-y-2.5">
          {discrepancies.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/discrepancias/${d.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[14.5px] font-extrabold text-navy-900">{d.code}</h2>
                    <Badge tone={d.status === 'resolved' || d.status === 'accepted' ? 'success' : 'danger'}>
                      {LABELS.discrepancyStatus[d.status]}
                    </Badge>
                    <span className="text-[11.5px] font-semibold text-ink-400">
                      {LABELS.discrepancyType[d.type]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-400">
                    {businessById.get(d.shipments?.pyme_id ?? '') ?? 'PyME'} · envío{' '}
                    {d.shipments?.code} · {d.shipments?.warehouses?.comuna}
                  </p>
                </div>

                <div className="text-right text-[12.5px]">
                  {d.units_short > 0 ? (
                    <p className="font-bold text-danger-600">−{d.units_short} u</p>
                  ) : null}
                  {d.units_over > 0 ? (
                    <p className="font-bold text-warning-600">+{d.units_over} u</p>
                  ) : null}
                  {Number(d.excess_m3 ?? 0) > 0 ? (
                    <p className="font-bold text-danger-600">
                      +{formatNumber(Number(d.excess_m3), 2)} m³
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
