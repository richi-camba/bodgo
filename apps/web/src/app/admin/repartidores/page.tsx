import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Repartidores' };

export default async function AdminCouriersPage() {
  const supabase = await createClient();

  const [{ data: couriers }, { data: deliveries }] = await Promise.all([
    supabase.from('courier_profiles').select('*'),
    supabase.from('deliveries').select('courier_id, status, courier_fee, commission_amount, distance_km'),
  ]);

  const ids = (couriers ?? []).map((c) => c.profile_id);
  const { data: profiles } = ids.length
    ? await supabase.from('public_profiles').select('id, full_name').in('id', ids)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const delivered = (deliveries ?? []).filter((d) => d.status === 'delivered');
  const openTrips = (deliveries ?? []).filter((d) =>
    ['offered', 'accepted', 'picked_up', 'in_transit'].includes(d.status),
  );
  const commission = delivered.reduce((s, d) => s + d.commission_amount, 0);

  const rows = (couriers ?? []).map((c) => {
    const own = delivered.filter((d) => d.courier_id === c.profile_id);
    return {
      id: c.profile_id,
      name: nameById.get(c.profile_id) ?? '—',
      vehicle: LABELS.vehicle[c.vehicle],
      plate: c.plate,
      rating: Number(c.rating),
      online: c.is_online,
      documentsOk: c.documents_ok,
      trips: own.length,
      earned: own.reduce((s, d) => s + d.courier_fee, 0),
      km: own.reduce((s, d) => s + Number(d.distance_km ?? 0), 0),
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Repartidores" subtitle="La flota de la red y su actividad." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={rows.length} label="Repartidores" />
        <Stat value={rows.filter((r) => r.online).length} label="En línea ahora" tone="success" />
        <Stat value={openTrips.length} label="Viajes en curso" />
        <Stat value={formatCLP(commission)} label="Comisión de viajes" />
      </div>

      {!rows.length ? (
        <EmptyState icon="🛵" title="Sin repartidores" body="Todavía nadie se dio de alta en la flota." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-[13px]">
            <thead>
              <tr className="border-b border-line-100 bg-surface-25 text-left text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-bold">Repartidor</th>
                <th className="px-3 py-3 font-bold">Vehículo</th>
                <th className="px-3 py-3 text-right font-bold">★</th>
                <th className="px-3 py-3 text-right font-bold">Viajes</th>
                <th className="px-3 py-3 text-right font-bold">km</th>
                <th className="px-3 py-3 text-right font-bold">Cobrado</th>
                <th className="px-5 py-3 text-right font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-bold text-navy-900">{r.name}</td>
                  <td className="px-3 py-3 text-ink-700">
                    {r.vehicle}
                    {r.plate ? ` · ${r.plate}` : ''}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.rating.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.trips}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(r.km, 1)}</td>
                  <td className="px-3 py-3 text-right font-bold tabular-nums">{formatCLP(r.earned)}</td>
                  <td className="px-5 py-3 text-right">
                    {!r.documentsOk ? (
                      <Badge tone="warning">Documentos</Badge>
                    ) : r.online ? (
                      <Badge tone="success">En línea</Badge>
                    ) : (
                      <Badge>Fuera de línea</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
