import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { ButtonLink } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { ShipmentBuilder } from './builder';

export const metadata: Metadata = { title: 'Nuevo envío' };

export default async function NewShipmentPage() {
  const supabase = await createClient();

  const [{ data: contracts }, { data: products }, { data: pyme }] = await Promise.all([
    supabase
      .from('contracts')
      .select('id, m2, capacity_m3, warehouse_id, warehouses(comuna, sector_label, bodeguero_id)')
      .eq('status', 'active'),
    supabase.from('products').select('id, name, sku, category, unit_volume_m3').eq('active', true).order('name'),
    supabase.from('pyme_profiles').select('address').single(),
  ]);

  if (!contracts?.length) {
    return (
      <div>
        <PageHeader title="Nuevo envío" />
        <EmptyState
          icon="📄"
          title="Primero necesitas una bodega contratada"
          body="Un envío se manda contra un contrato vigente: eso es lo que define cuánto volumen puedes ocupar."
          action={<ButtonLink href="/app/buscar">Buscar microbodega</ButtonLink>}
        />
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div>
        <PageHeader title="Nuevo envío" />
        <EmptyState
          title="Tu catálogo está vacío"
          body="El manifiesto se arma con productos de tu catálogo. Crea al menos uno antes de preparar el envío."
          action={<ButtonLink href="/app/inventario">Ir a mi inventario</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div>
      <Link href="/app/despachos" className="mb-4 inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a mis envíos
      </Link>

      <PageHeader
        title="Nuevo envío a bodega"
        subtitle="Declara qué mandas y cuánto. El bodeguero verifica contra esta lista al recibir."
      />

      <ShipmentBuilder
        contracts={contracts.map((c) => ({
          id: c.id,
          warehouseId: c.warehouse_id,
          comuna: c.warehouses?.comuna ?? '',
          sector: c.warehouses?.sector_label ?? '',
          m2: Number(c.m2),
          capacityM3: Number(c.capacity_m3 ?? 0),
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          unitVolumeM3: Number(p.unit_volume_m3),
        }))}
        defaultPickupAddress={pyme?.address ?? ''}
      />
    </div>
  );
}
