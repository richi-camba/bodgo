import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { OrderBuilder } from './builder';

export const metadata: Metadata = { title: 'Nuevo pedido' };

export default async function NewOrderPage() {
  const supabase = await createClient();

  const { data: inventory } = await supabase
    .from('inventory')
    .select('quantity, warehouse_id, products(id, name, sku), warehouses(comuna, lat, lng)')
    .gt('quantity', 0);

  if (!inventory?.length) {
    return (
      <div>
        <PageHeader title="Nuevo pedido" />
        <EmptyState
          icon="inventario"
          title="No tienes stock en bodega"
          body="Un pedido se despacha desde una microbodega. Envía mercadería y espera que el bodeguero confirme la recepción."
          action={<ButtonLink href="/app/despachos/nuevo">Preparar un envío</ButtonLink>}
        />
      </div>
    );
  }

  // Se agrupa por bodega: el pedido sale de un solo punto, así que primero se
  // elige desde dónde y después qué hay ahí.
  const byWarehouse = new Map<
    string,
    { id: string; comuna: string; lat: number | null; lng: number | null; items: { id: string; name: string; sku: string; stock: number }[] }
  >();

  for (const row of inventory) {
    if (!row.products) continue;
    const entry = byWarehouse.get(row.warehouse_id) ?? {
      id: row.warehouse_id,
      comuna: row.warehouses?.comuna ?? 'Bodega',
      lat: row.warehouses?.lat ?? null,
      lng: row.warehouses?.lng ?? null,
      items: [],
    };
    entry.items.push({
      id: row.products.id,
      name: row.products.name,
      sku: row.products.sku,
      stock: row.quantity,
    });
    byWarehouse.set(row.warehouse_id, entry);
  }

  return (
    <div>
      <Link href="/app/pedidos" className="mb-4 inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a mis pedidos
      </Link>

      <PageHeader
        title="Nuevo pedido"
        subtitle="Despacha una venta desde la microbodega más cerca del comprador."
      />

      <OrderBuilder warehouses={[...byWarehouse.values()]} />
    </div>
  );
}
