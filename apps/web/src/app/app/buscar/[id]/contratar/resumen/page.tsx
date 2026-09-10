import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { SummaryStep } from './summary-step';

export const metadata: Metadata = { title: 'Resumen y pago' };

export default async function ContratarPaso2({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m2?: string }>;
}) {
  const { id } = await params;
  const { m2: m2Raw } = await searchParams;
  await requireUser('pyme');

  const m2 = Number(m2Raw);
  // Sin superficie no hay nada que resumir: se vuelve al paso anterior en vez
  // de mostrar un total en cero.
  if (!Number.isFinite(m2) || m2 < 1) redirect(`/app/buscar/${id}/contratar`);

  const supabase = await createClient();

  const [{ data: w }, { data: cards }] = await Promise.all([
    supabase
      .from('warehouse_listings')
      .select('id, comuna, available_m2, price_per_m2, bodeguero_name, photo_path')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('payment_methods')
      .select('id, brand, last4, holder_name, is_default')
      .order('is_default', { ascending: false }),
  ]);

  if (!w) notFound();

  const disponible = Number(w.available_m2 ?? 0);
  if (m2 > disponible) redirect(`/app/buscar/${id}/contratar`);

  return (
    <div className="pb-24">
      <StepHeader titulo="Resumen y pago" volverA={`/app/buscar/${id}/contratar`} />

      <SummaryStep
        warehouseId={w.id!}
        comuna={w.comuna ?? ''}
        bodeguero={w.bodeguero_name ?? ''}
        photo={w.photo_path}
        m2={m2}
        pricePerM2={w.price_per_m2 ?? 0}
        cards={cards ?? []}
      />
    </div>
  );
}
