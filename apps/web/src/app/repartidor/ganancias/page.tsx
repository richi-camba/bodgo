import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { COURIER_COMMISSION_RATE, formatCLP, formatNumber } from '@bodgo/core';

export const metadata: Metadata = { title: 'Ganancias' };

export default async function EarningsPage() {
  const user = await requireUser('repartidor');
  const supabase = await createClient();

  const { data: trips } = await supabase
    .from('deliveries')
    .select(
      'id, code, zone, distance_km, courier_fee, buyer_fee, commission_amount, delivered_at, warehouses(comuna), orders(buyer_comuna)',
    )
    .eq('courier_id', user.id)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false })
    .limit(50);

  const { data: profile } = await supabase
    .from('courier_profiles')
    .select('bank_name, bank_account_last4, trips_count')
    .eq('profile_id', user.id)
    .single();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfDay);
  // Semana chilena: parte el lunes.
  startOfWeek.setDate(startOfDay.getDate() - ((startOfDay.getDay() + 6) % 7));

  const inRange = (from: Date) =>
    (trips ?? []).filter((t) => t.delivered_at && new Date(t.delivered_at) >= from);

  const today = inRange(startOfDay);
  const week = inRange(startOfWeek);

  const sum = (rows: typeof today) => rows.reduce((s, t) => s + t.courier_fee, 0);
  const km = (rows: typeof today) => rows.reduce((s, t) => s + Number(t.distance_km ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Ganancias" subtitle="Tus viajes y lo que llevas cobrado." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={formatCLP(sum(today))} label="Hoy" tone="success" />
        <Stat value={today.length} label={today.length === 1 ? 'Viaje hoy' : 'Viajes hoy'} />
        <Stat value={formatCLP(sum(week))} label="Esta semana" />
        <Stat value={`${formatNumber(km(week), 1)} km`} label="Recorridos" />
      </div>

      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Cómo se reparte cada viaje</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
          El comprador paga la tarifa de su zona. BodGo retiene un{' '}
          {Math.round(COURIER_COMMISSION_RATE * 100)}% y el resto es tuyo, redondeado a la centena.
          Lo que ves antes de aceptar un viaje es exactamente lo que cobras.
        </p>
        {profile?.bank_name ? (
          <p className="mt-4 rounded-field bg-surface-50 p-3.5 text-[12.5px] text-ink-500">
            Se deposita en {profile.bank_name} ····{profile.bank_account_last4}.
          </p>
        ) : (
          <p className="mt-4 rounded-field bg-warning-50 p-3.5 text-[12.5px] font-semibold text-warning-600">
            Falta tu cuenta bancaria. Cárgala en tu perfil para poder recibir los pagos.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">Viajes recientes</h2>

        {!trips?.length ? (
          <EmptyState
            icon="🛵"
            title="Todavía no completas viajes"
            body="Ponte en línea y acepta el primero. Acá se va a ir sumando lo que ganes."
          />
        ) : (
          <ul className="space-y-2.5">
            {trips.map((t) => (
              <li key={t.id} className="card flex flex-wrap items-center gap-4 p-4">
                <span aria-hidden className="text-[19px]">
                  🛵
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-navy-900">
                    {t.warehouses?.comuna} → {t.orders?.buyer_comuna}
                  </p>
                  <p className="text-[11.5px] text-ink-400">
                    {t.code} ·{' '}
                    {t.delivered_at
                      ? new Date(t.delivered_at).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                    {t.distance_km != null ? ` · ${formatNumber(Number(t.distance_km), 1)} km` : ''}
                  </p>
                </div>
                <Badge>Zona {t.zone}</Badge>
                <span className="text-[15px] font-extrabold text-success-700 tabular-nums">
                  +{formatCLP(t.courier_fee)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
