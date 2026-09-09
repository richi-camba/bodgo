import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';
import { ApproveForm } from './approve-form';

export const metadata: Metadata = { title: 'Microbodegas' };

const TONE = {
  draft: 'neutral',
  pending_review: 'warning',
  active: 'success',
  paused: 'neutral',
  rejected: 'danger',
} as const;

export default async function AdminWarehousesPage() {
  const supabase = await createClient();

  const [{ data: warehouses }, { data: contracts }] = await Promise.all([
    supabase.from('warehouses').select('*').order('status').order('comuna'),
    supabase.from('contracts').select('warehouse_id, m2').eq('status', 'active'),
  ]);

  const hostIds = [...new Set((warehouses ?? []).map((w) => w.bodeguero_id))];
  const { data: hosts } = hostIds.length
    ? await supabase.from('public_profiles').select('id, full_name').in('id', hostIds)
    : { data: [] };
  const hostById = new Map((hosts ?? []).map((h) => [h.id, h.full_name]));

  const takenByWarehouse = new Map<string, number>();
  for (const c of contracts ?? []) {
    takenByWarehouse.set(c.warehouse_id, (takenByWarehouse.get(c.warehouse_id) ?? 0) + Number(c.m2));
  }

  const pending = (warehouses ?? []).filter((w) => w.status === 'pending_review');

  return (
    <div className="space-y-5">
      <PageHeader title="Microbodegas de la red" subtitle="Habilitación, ocupación y estado de cada espacio." />

      {pending.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">
            Esperando habilitación ({pending.length})
          </h2>
          <ul className="space-y-3">
            {pending.map((w) => (
              <li key={w.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15.5px] font-extrabold text-navy-900">
                      {w.comuna} · {formatNumber(Number(w.total_m2), 1)} m²
                    </h3>
                    <p className="mt-0.5 text-[12.5px] text-ink-400">
                      {hostById.get(w.bodeguero_id)} · {w.address}
                    </p>
                  </div>
                  <Badge tone="warning">En revisión</Badge>
                </div>
                <div className="mt-4 border-t border-line-100 pt-4">
                  <ApproveForm warehouseId={w.id} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!warehouses?.length ? (
        <EmptyState icon="bodegas" title="Sin microbodegas" body="Todavía no hay espacios publicados en la red." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-[13px]">
            <thead>
              <tr className="border-b border-line-100 bg-surface-25 text-left text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-bold">Comuna</th>
                <th className="px-3 py-3 font-bold">Bodeguero</th>
                <th className="px-3 py-3 text-right font-bold">m²</th>
                <th className="px-3 py-3 text-right font-bold">Ocupación</th>
                <th className="px-3 py-3 text-right font-bold">Precio/m²</th>
                <th className="px-5 py-3 text-right font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100">
              {warehouses.map((w) => {
                const taken = takenByWarehouse.get(w.id) ?? 0;
                const pct = Number(w.total_m2) > 0 ? Math.round((taken / Number(w.total_m2)) * 100) : 0;
                return (
                  <tr key={w.id}>
                    <td className="px-5 py-3">
                      <p className="font-bold text-navy-900">{w.comuna}</p>
                      <p className="text-[11.5px] text-ink-400">{w.code}</p>
                    </td>
                    <td className="px-3 py-3 text-ink-700">{hostById.get(w.bodeguero_id)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(Number(w.total_m2), 1)}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{pct}%</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatCLP(w.price_per_m2)}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge tone={TONE[w.status]}>{LABELS.warehouseStatus[w.status]}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
