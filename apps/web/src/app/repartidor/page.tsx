import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { formatCLP } from '@bodgo/core';
import { ActiveTrip } from './active-trip';
import { OfferList } from './offer-list';
import { OnlineToggle } from './online-toggle';

export const metadata: Metadata = { title: 'Viajes' };

export default async function CourierHome() {
  const user = await requireUser('repartidor');
  const supabase = await createClient();

  const { data: courier } = await supabase
    .from('courier_profiles')
    .select('is_online, documents_ok, trips_count, rating')
    .eq('profile_id', user.id)
    .single();

  // El viaje en curso manda: mientras haya uno, no se muestran ofertas.
  const { data: active } = await supabase
    .from('deliveries')
    .select(
      'id, code, status, zone, distance_km, eta_minutes, courier_fee, order_id, warehouse_id, warehouses(comuna, address, address_reference, bodeguero_id), orders(code, buyer_name, buyer_phone, buyer_address, buyer_comuna, delivery_notes)',
    )
    .eq('courier_id', user.id)
    .in('status', ['accepted', 'picked_up', 'in_transit'])
    .maybeSingle();

  const { data: host } = active?.warehouses?.bodeguero_id
    ? await supabase
        .from('public_profiles')
        .select('full_name')
        .eq('id', active.warehouses.bodeguero_id)
        .maybeSingle()
    : { data: null };

  const offers = active
    ? []
    : ((
        await supabase
          .from('delivery_offers')
          .select('*')
          .order('offered_at', { ascending: true })
      ).data ?? []);

  // Lo ganado hoy, para que la cifra de la portada sea la de verdad.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayTrips } = await supabase
    .from('deliveries')
    .select('courier_fee')
    .eq('courier_id', user.id)
    .eq('status', 'delivered')
    .gte('delivered_at', startOfDay.toISOString());

  const todayEarnings = (todayTrips ?? []).reduce((sum, t) => sum + t.courier_fee, 0);

  const firstName = user.fullName.split(' ')[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13.5px] text-ink-500">Hola, {firstName} 👋</p>
          <h1 className="mt-0.5 text-[24px] font-extrabold tracking-tight text-navy-900">
            {active ? 'Tienes un viaje en curso' : courier?.is_online ? 'Buscando viajes' : 'Estás fuera de línea'}
          </h1>
        </div>
        <OnlineToggle online={courier?.is_online ?? false} />
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Metric label="Ganado hoy" value={formatCLP(todayEarnings)} />
        <Metric label="Viajes hechos" value={String(courier?.trips_count ?? 0)} />
        <Metric label="Calificación" value={`★ ${Number(courier?.rating ?? 5).toFixed(1)}`} />
      </dl>

      {!courier?.documents_ok ? (
        <p className="rounded-card border border-warning-600/25 bg-warning-50 px-4 py-3 text-[13px] leading-relaxed text-warning-600">
          ⚠️ Tus documentos están en revisión. Puedes recorrer la app, pero un evaluador de BodGo
          tiene que aprobarlos antes de que te lleguen viajes reales.
        </p>
      ) : null}

      {active ? (
        <ActiveTrip
          trip={{
            id: active.id,
            code: active.code,
            status: active.status,
            zone: active.zone,
            distanceKm: active.distance_km == null ? null : Number(active.distance_km),
            etaMinutes: active.eta_minutes,
            fee: active.courier_fee,
            orderCode: active.orders?.code ?? '',
            pickupComuna: active.warehouses?.comuna ?? '',
            pickupAddress: active.warehouses?.address ?? '',
            pickupReference: active.warehouses?.address_reference ?? null,
            hostName: host?.full_name ?? null,
            buyerName: active.orders?.buyer_name ?? '',
            buyerPhone: active.orders?.buyer_phone ?? null,
            buyerAddress: active.orders?.buyer_address ?? '',
            buyerComuna: active.orders?.buyer_comuna ?? '',
            notes: active.orders?.delivery_notes ?? null,
          }}
        />
      ) : (
        <OfferList offers={offers} online={courier?.is_online ?? false} />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <dt className="text-[11.5px] text-ink-500">{label}</dt>
      <dd className="mt-1 text-[19px] font-extrabold leading-none text-navy-900 tabular-nums">
        {value}
      </dd>
    </div>
  );
}
