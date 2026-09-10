import type { Metadata } from 'next';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { ImportProducts } from './import-products';

export const metadata: Metadata = { title: 'Carga masiva' };

export default async function ImportPage() {
  const supabase = await createClient();

  // Los SKUs que ya existen para poder decir, antes de importar, cuáles se
  // crean y cuáles se actualizan.
  const { data: products } = await supabase.from('products').select('sku');

  return (
    <div>
      <StepHeader titulo="Carga masiva" volverA="/app/inventario" />
      <ImportProducts skusExistentes={(products ?? []).map((p) => p.sku)} />
    </div>
  );
}
