import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber } from '@bodgo/core';

export const metadata: Metadata = { title: 'PyMEs' };

export default async function AdminPymesPage() {
  const supabase = await createClient();

  const [{ data: pymes }, { data: contracts }, { data: orders }, { data: products }] = await Promise.all([
    supabase.from('pyme_profiles').select('*').order('business_name'),
    supabase.from('contracts').select('pyme_id, m2, total_amount, status').eq('status', 'active'),
    supabase.from('orders').select('pyme_id, total_amount, status'),
    supabase.from('products').select('pyme_id').eq('active', true),
  ]);

  const rows = (pymes ?? []).map((p) => {
    const own = (contracts ?? []).filter((c) => c.pyme_id === p.profile_id);
    const sales = (orders ?? []).filter((o) => o.pyme_id === p.profile_id);
    return {
      ...p,
      warehouses: own.length,
      m2: own.reduce((s, c) => s + Number(c.m2), 0),
      monthly: own.reduce((s, c) => s + c.total_amount, 0),
      gmv: sales.reduce((s, o) => s + (o.total_amount ?? 0), 0),
      orders: sales.length,
      skus: (products ?? []).filter((x) => x.pyme_id === p.profile_id).length,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader title="PyMEs" subtitle="Empresas que arriendan espacio en la red." />

      {!rows.length ? (
        <EmptyState icon="pymes" title="Sin PyMEs registradas" body="Todavía nadie se ha dado de alta." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-line-100 bg-surface-25 text-left text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-bold">Negocio</th>
                <th className="px-3 py-3 font-bold">Comuna</th>
                <th className="px-3 py-3 text-right font-bold">Bodegas</th>
                <th className="px-3 py-3 text-right font-bold">m²</th>
                <th className="px-3 py-3 text-right font-bold">SKUs</th>
                <th className="px-3 py-3 text-right font-bold">Pedidos</th>
                <th className="px-5 py-3 text-right font-bold">GMV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100">
              {rows.map((p) => (
                <tr key={p.profile_id}>
                  <td className="px-5 py-3">
                    <p className="font-bold text-navy-900">{p.business_name}</p>
                    <p className="text-[11.5px] text-ink-400">{p.email ?? p.rut ?? '—'}</p>
                  </td>
                  <td className="px-3 py-3 text-ink-700">{p.comuna ?? '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.warehouses}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(p.m2, 1)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.skus}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.orders}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-bold text-navy-900 tabular-nums">{formatCLP(p.gmv)}</span>
                    {p.warehouses > 0 ? (
                      <Badge tone="success" className="ml-2">
                        Activa
                      </Badge>
                    ) : null}
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
