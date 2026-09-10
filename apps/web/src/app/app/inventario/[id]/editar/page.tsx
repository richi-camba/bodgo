import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { EditProductForm } from './form';

export const metadata: Metadata = { title: 'Editar producto' };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('id, name, sku, category, unit_volume_m3, target_stock')
    .eq('id', id)
    .maybeSingle();

  if (!product) notFound();

  return (
    <div>
      <StepHeader titulo="Editar producto" volverA={`/app/inventario/${product.id}`} />

      <EditProductForm
        productId={product.id}
        name={product.name}
        sku={product.sku}
        category={product.category}
        unitVolumeM3={Number(product.unit_volume_m3)}
        targetStock={product.target_stock}
      />
    </div>
  );
}
