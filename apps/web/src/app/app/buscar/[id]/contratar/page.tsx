import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { SizeStep } from './size-step';

export const metadata: Metadata = { title: 'Contratar bodega' };

export default async function ContratarPaso1({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser('pyme');
  const supabase = await createClient();

  const { data: w } = await supabase
    .from('warehouse_listings')
    .select('id, comuna, total_m2, available_m2, price_per_m2, bodeguero_name, photo_path')
    .eq('id', id)
    .maybeSingle();

  if (!w) notFound();

  return (
    <div className="pb-24">
      <StepHeader titulo="Contratar bodega" volverA={`/app/buscar/${id}`} />

      <SizeStep
        warehouseId={w.id!}
        comuna={w.comuna ?? ''}
        bodeguero={w.bodeguero_name ?? ''}
        totalM2={Number(w.total_m2 ?? 0)}
        availableM2={Number(w.available_m2 ?? 0)}
        pricePerM2={w.price_per_m2 ?? 0}
        photo={w.photo_path}
      />
    </div>
  );
}
