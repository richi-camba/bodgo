import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatNumber } from '@bodgo/core';
import { NewProductForm } from './new-product-form';

export const metadata: Metadata = { title: 'Mi inventario' };

export default async function InventoryPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: inventory }] = await Promise.all([
    supabase.from('products').select('id, name, sku, category, unit_volume_m3').eq('active', true).order('name'),
    supabase.from('inventory').select('product_id, quantity, position_label, warehouse_id, warehouses(comuna)'),
  ]);

  const stockByProduct = new Map<string, { total: number; places: { comuna: string; qty: number; position: string | null }[] }>();

  for (const row of inventory ?? []) {
    const entry = stockByProduct.get(row.product_id) ?? { total: 0, places: [] };
    entry.total += row.quantity;
    entry.places.push({
      comuna: row.warehouses?.comuna ?? 'Bodega',
      qty: row.quantity,
      position: row.position_label,
    });
    stockByProduct.set(row.product_id, entry);
  }

  const totalUnits = [...stockByProduct.values()].reduce((s, e) => s + e.total, 0);
  const withStock = [...stockByProduct.values()].filter((e) => e.total > 0).length;
  const outOfStock = (products ?? []).filter((p) => (stockByProduct.get(p.id)?.total ?? 0) === 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mi inventario"
        subtitle="Stock en tiempo real, repartido entre tus microbodegas."
        action={<ButtonLink href="/app/despachos/nuevo" size="sm">Enviar mercancía</ButtonLink>}
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat value={products?.length ?? 0} label="SKUs en el catálogo" />
        <Stat value={withStock} label="Con stock" />
        <Stat value={formatNumber(totalUnits)} label="Unidades guardadas" />
      </div>

      {outOfStock.length > 0 && products?.length ? (
        <p className="rounded-card border border-warning-600/25 bg-warning-50 px-4 py-3 text-[13px] font-semibold text-warning-700">
          ⚠️ {outOfStock.length} {outOfStock.length === 1 ? 'producto está' : 'productos están'} sin
          stock en bodega. Prepara un envío para reponer.
        </p>
      ) : null}

      {!products?.length ? (
        <EmptyState
          title="Tu catálogo está vacío"
          body="Crea tus productos con su SKU y su volumen unitario. El volumen es lo que nos permite avisarte si un envío no cabe en el espacio que contrataste."
        />
      ) : (
        <ul className="space-y-2.5">
          {products.map((p) => {
            const stock = stockByProduct.get(p.id);
            return (
              <li key={p.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-extrabold text-navy-900">{p.name}</h2>
                    <p className="mt-0.5 text-[12.5px] text-ink-400">
                      {p.sku}
                      {p.category ? ` · ${p.category}` : ''} ·{' '}
                      {formatNumber(Number(p.unit_volume_m3) * 1000, 1)} L por unidad
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[19px] font-extrabold leading-none text-navy-900 tabular-nums">
                      {formatNumber(stock?.total ?? 0)}
                    </p>
                    <p className="text-[11px] text-ink-400">unidades</p>
                  </div>
                </div>

                {stock?.places.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2 border-t border-line-100 pt-3">
                    {stock.places.map((place) => (
                      <li key={`${place.comuna}-${place.position}`}>
                        <Badge tone="brand">
                          {place.comuna}
                          {place.position ? ` · ${place.position}` : ''} — {formatNumber(place.qty)} u
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 border-t border-line-100 pt-3 text-[12.5px] text-ink-400">
                    Sin stock en bodega. El stock se suma cuando el bodeguero confirma la recepción.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <NewProductForm />
    </div>
  );
}
