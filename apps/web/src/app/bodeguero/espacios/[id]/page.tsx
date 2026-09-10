import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, LABELS, usableCapacityM3 } from '@bodgo/core';
import { EditSpaceForm } from './form';

export const metadata: Metadata = { title: 'Editar espacio' };

const TONE: Record<string, Tone> = {
  draft: 'neutral',
  pending_review: 'warning',
  active: 'success',
  paused: 'neutral',
  rejected: 'danger',
};

export default async function SpaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: space } = await supabase.from('warehouses').select('*').eq('id', id).maybeSingle();
  if (!space) notFound();

  const [{ data: contracts }, { data: checklist }, { data: photos }] = await Promise.all([
    supabase.from('contracts').select('m2').eq('warehouse_id', id).eq('status', 'active'),
    supabase.from('warehouse_checklist').select('item, status').eq('warehouse_id', id),
    supabase
      .from('warehouse_photos')
      .select('storage_path')
      .eq('warehouse_id', id)
      .order('sort_order')
      .limit(1),
  ]);

  const arrendados = (contracts ?? []).reduce((s, c) => s + Number(c.m2), 0);
  const total = Number(space.total_m2);
  const pendientes = (checklist ?? []).filter((c) => c.status === 'pending');
  const foto = photos?.[0]?.storage_path;

  return (
    <div>
      <StepHeader
        titulo="Editar espacio"
        subtitulo={`${space.code} · ${formatNumber(total, 0)} m² · ${formatNumber(usableCapacityM3(total), 1)} m³ apilables`}
        volverA="/bodeguero/espacios"
        accion={<Badge tone={TONE[space.status] ?? 'neutral'}>{LABELS.warehouseStatus[space.status]}</Badge>}
      />

      <div className="relative mb-4 block h-[140px] w-full overflow-hidden rounded-[16px] bg-rayado">
        {foto ? <Image src={foto} alt="" fill sizes="100vw" className="object-cover" /> : null}
      </div>

      {space.status === 'pending_review' ? (
        <div className="mb-4 rounded-[14px] bg-warning-50 p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold text-warning-700">
            <Icon name="reloj" size={15} />
            Enviado a revisión
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">
            Un evaluador de BodGo agenda la visita de habilitación en los próximos 3 a 5 días
            hábiles. Mientras tanto: despeja el espacio, deja el extintor a la vista y ten a mano el
            certificado de dominio o el contrato de arriendo.
          </p>
          {pendientes.length ? (
            <ul className="mt-3 space-y-1">
              {pendientes.map((c) => (
                <li key={c.item} className="flex items-start gap-2 text-[12px] text-ink-700">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning-600" />
                  {c.item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <EditSpaceForm
        warehouseId={space.id}
        comuna={space.comuna}
        address={space.address}
        addressReference={space.address_reference}
        totalM2={total}
        pricePerM2={space.price_per_m2}
        description={space.description}
        access247={space.access_24_7}
        receptionHours={space.reception_hours}
        weekendHours={space.weekend_hours}
        arrendados={arrendados}
        status={space.status}
      />
    </div>
  );
}
