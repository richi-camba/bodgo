import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, usableCapacityM3 } from '@bodgo/core';

export const metadata: Metadata = { title: 'Inventario' };

export default async function HostInventoryPage() {
  const supabase = await createClient();

  const [{ data: spaces }, { data: inventory }] = await Promise.all([
    supabase.from('warehouses').select('id, comuna, total_m2'),
    supabase
      .from('inventory')
      .select('id, quantity, position_label, warehouse_id, products(id, name, sku, pyme_id, unit_volume_m3)'),
  ]);

  const pymeIds = [...new Set((inventory ?? []).map((i) => i.products?.pyme_id).filter(Boolean))] as string[];
  const { data: pymes } = pymeIds.length
    ? await supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', pymeIds)
    : { data: [] };
  const businessById = new Map((pymes ?? []).map((p) => [p.profile_id, p.business_name]));

  const totalUnits = (inventory ?? []).reduce((s, i) => s + i.quantity, 0);
  const distinctPymes = new Set(pymeIds).size;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventario"
        subtitle="Mercancía almacenada en tus espacios, por PyME."
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat value={formatNumber(totalUnits)} label="Unidades guardadas" />
        <Stat value={new Set((inventory ?? []).map((i) => i.products?.id)).size} label="Productos distintos" />
        <Stat value={distinctPymes} label={distinctPymes === 1 ? 'PyME' : 'PyMEs'} />
      </div>

      {!inventory?.length ? (
        <EmptyState
          title="Todavía no guardas mercadería"
          body="El stock aparece acá una vez que confirmas la recepción de un envío contra su manifiesto."
        />
      ) : (
        (spaces ?? []).map((space) => {
          const rows = (inventory ?? []).filter((i) => i.warehouse_id === space.id);
          if (rows.length === 0) return null;

          const usedM3 = rows.reduce(
            (s, i) => s + i.quantity * Number(i.products?.unit_volume_m3 ?? 0),
            0,
          );
          const capacity = usableCapacityM3(Number(space.total_m2));

          return (
            <section key={space.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
                <h2 className="text-[15px] font-extrabold text-navy-900">
                  {space.comuna} · {formatNumber(Number(space.total_m2), 1)} m²
                </h2>
                <span className="text-[12.5px] text-ink-500 tabular-nums">
                  {formatNumber(usedM3, 2)} de {formatNumber(capacity, 1)} m³ ocupados
                </span>
              </div>

              <ul className="mt-3 divide-y divide-line-100">
                {rows.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold text-navy-900">
                        {row.products?.name}
                      </p>
                      <p className="text-[11.5px] text-ink-400">
                        {row.products?.sku} · {businessById.get(row.products?.pyme_id ?? '') ?? 'PyME'}
                      </p>
                    </div>

                    {row.position_label ? <Badge>{row.position_label}</Badge> : null}

                    <div className="text-right">
                      <p className="text-[15px] font-extrabold text-navy-900 tabular-nums">
                        {formatNumber(row.quantity)}
                      </p>
                      <p className="text-[11px] text-ink-400">unidades</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
