import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/stat';
import { Avatar } from '@/components/app/shell';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { LABELS } from '@bodgo/core';
import { CourierProfileForm } from './form';

export const metadata: Metadata = { title: 'Mi perfil' };

export default async function CourierProfilePage() {
  const user = await requireUser('repartidor');
  const supabase = await createClient();

  const { data: courier } = await supabase
    .from('courier_profiles')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  return (
    <div className="space-y-5">
      <PageHeader title="Mi perfil" />

      <header className="card flex items-center gap-4 p-6">
        <Avatar initials={user.initials} size={52} />
        <div>
          <h1 className="text-[19px] font-extrabold tracking-tight text-navy-900">{user.fullName}</h1>
          <p className="text-[13.5px] text-ink-500">
            ★ {Number(courier?.rating ?? 5).toFixed(1)} · {courier?.trips_count ?? 0} viajes
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {courier ? (
              <Badge tone="brand">
                {LABELS.vehicle[courier.vehicle]}
                {courier.plate ? ` · ${courier.plate}` : ''}
              </Badge>
            ) : null}
            <Badge tone={courier?.documents_ok ? 'success' : 'warning'}>
              {courier?.documents_ok ? 'Documentos al día' : 'Documentos en revisión'}
            </Badge>
          </div>
        </div>
      </header>

      <CourierProfileForm
        initial={{
          vehicle: courier?.vehicle ?? 'moto',
          plate: courier?.plate ?? '',
          phone: courier?.phone ?? '',
          bankName: courier?.bank_name ?? '',
          bankLast4: courier?.bank_account_last4 ?? '',
        }}
      />

      <section className="card p-5">
        <h2 className="text-eyebrow">Zona preferida</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-700">
          {courier?.preferred_comunas?.length
            ? courier.preferred_comunas.join(' · ')
            : 'Todavía no eliges comunas. Por ahora te llegan todos los viajes de la red.'}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-eyebrow">Cómo funcionan los pagos</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-700">
          Cada viaje entregado suma a tu saldo con el monto que viste antes de aceptarlo. La
          entrega necesita foto: sin ella el viaje no se puede cerrar, y es lo que te respalda si el
          comprador reclama.
        </p>
      </section>
    </div>
  );
}
