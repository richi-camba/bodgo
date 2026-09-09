import type { Metadata } from 'next';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { calculateHostPayout, formatCLP, formatNumber } from '@bodgo/core';

export const metadata: Metadata = { title: 'Bodegueros' };

export default async function AdminHostsPage() {
  const supabase = await createClient();

  const [{ data: hosts }, { data: warehouses }, { data: contracts }] = await Promise.all([
    supabase.from('bodeguero_profiles').select('*'),
    supabase.from('warehouses').select('id, bodeguero_id, total_m2, status'),
    supabase.from('contracts').select('warehouse_id, m2, base_amount, status').eq('status', 'active'),
  ]);

  const hostIds = (hosts ?? []).map((h) => h.profile_id);
  const { data: profiles } = hostIds.length
    ? await supabase.from('public_profiles').select('id, full_name, verified').in('id', hostIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows = (hosts ?? []).map((h) => {
    const own = (warehouses ?? []).filter((w) => w.bodeguero_id === h.profile_id);
    const ownIds = new Set(own.map((w) => w.id));
    const active = (contracts ?? []).filter((c) => ownIds.has(c.warehouse_id));
    const totalM2 = own.reduce((s, w) => s + Number(w.total_m2), 0);
    const takenM2 = active.reduce((s, c) => s + Number(c.m2), 0);
    const gross = active.reduce((s, c) => s + c.base_amount, 0);

    return {
      id: h.profile_id,
      name: profileById.get(h.profile_id)?.full_name ?? '—',
      rating: Number(h.rating),
      spaces: own.length,
      published: own.filter((w) => w.status === 'active').length,
      occupancy: totalM2 > 0 ? Math.round((takenM2 / totalM2) * 100) : 0,
      totalM2,
      net: calculateHostPayout(gross).net,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Bodegueros" subtitle="Anfitriones de la red y su liquidación proyectada." />

      {!rows.length ? (
        <EmptyState icon="bodegueros" title="Sin bodegueros" body="Todavía nadie publicó un espacio." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-[13px]">
            <thead>
              <tr className="border-b border-line-100 bg-surface-25 text-left text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-bold">Bodeguero</th>
                <th className="px-3 py-3 text-right font-bold">★</th>
                <th className="px-3 py-3 text-right font-bold">Espacios</th>
                <th className="px-3 py-3 text-right font-bold">m² totales</th>
                <th className="px-3 py-3 text-right font-bold">Ocupación</th>
                <th className="px-5 py-3 text-right font-bold">Neto del mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100">
              {rows.map((h) => (
                <tr key={h.id}>
                  <td className="px-5 py-3 font-bold text-navy-900">{h.name}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{h.rating.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {h.published} / {h.spaces}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(h.totalM2, 1)}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">{h.occupancy}%</td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">{formatCLP(h.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
