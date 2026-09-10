import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { TaskCard } from '@/components/app/task-card';
import { EmptyState, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { calculateHostPayout, formatCLP, formatNumber, LABELS, usableCapacityM3 } from '@bodgo/core';

export const metadata: Metadata = { title: 'Inicio' };

export default async function BodegueroHome() {
  const user = await requireUser('bodeguero');
  const supabase = await createClient();

  const [{ data: spaces }, { data: incoming }, { data: orders }, { data: contracts }, { data: inventory }] =
    await Promise.all([
      supabase.from('warehouses').select('id, comuna, total_m2, capacity_m3, status'),
      supabase
        .from('shipments')
        .select('id, code, description, packages_count, declared_volume_m3, pyme_id, warehouses(comuna)')
        .eq('status', 'in_transit')
        .order('dispatched_at'),
      supabase
        .from('orders')
        .select('id, code, status, buyer_comuna, warehouses(comuna)')
        .in('status', ['pending', 'queued', 'picking', 'ready']),
      supabase.from('contracts').select('id, m2, base_amount, status').eq('status', 'active'),
      supabase.from('inventory').select('quantity, warehouse_id, products(unit_volume_m3)'),
    ]);

  const gross = (contracts ?? []).reduce((s, c) => s + c.base_amount, 0);
  const payout = calculateHostPayout(gross);

  const totalM2 = (spaces ?? []).reduce((s, w) => s + Number(w.total_m2), 0);
  const takenM2 = (contracts ?? []).reduce((s, c) => s + Number(c.m2), 0);
  const occupancy = totalM2 > 0 ? Math.round((takenM2 / totalM2) * 100) : 0;

  const pymeIds = [...new Set((incoming ?? []).map((s) => s.pyme_id))];
  const { data: pymes } = pymeIds.length
    ? await supabase.from('pyme_profiles').select('profile_id, business_name').in('profile_id', pymeIds)
    : { data: [] };
  const businessById = new Map((pymes ?? []).map((p) => [p.profile_id, p.business_name]));

  const firstName = user.fullName.split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13.5px] text-ink-500">Hola, {firstName} 👋</p>
        <h1 className="mt-0.5 text-[24px] font-extrabold tracking-tight text-navy-900">
          Tus tareas de hoy
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          value={spaces?.length ?? 0}
          label={spaces?.length === 1 ? 'Mi espacio' : 'Mis espacios'}
          orden="etiqueta-primero"
        />
        <Stat value={`${occupancy}%`} label="Ocupación" orden="etiqueta-primero" />
        <Stat value={incoming?.length ?? 0} label="Por recibir" orden="etiqueta-primero" />
        <Stat value={formatCLP(payout.net)} label="Por liberar" orden="etiqueta-primero" />
      </div>

      {!spaces?.length ? (
        <EmptyState
          icon="espacios"
          title="Todavía no publicaste ningún espacio"
          body="Publica tu microbodega y un evaluador de BodGo agenda la visita de habilitación en 3 a 5 días hábiles. Sin costo de inscripción."
          action={<ButtonLink href="/bodeguero/espacios/nuevo">Publicar mi espacio</ButtonLink>}
        />
      ) : null}

      {/* ------------------------------------------------------ recepciones */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-navy-900">Recepción de mercancía</h2>
          <Link href="/bodeguero/recepciones" className="text-[12.5px] font-bold text-brand-600 hover:underline">
            Ver todas
          </Link>
        </div>

        {incoming?.length ? (
          <ul className="space-y-2.5">
            {incoming.map((s) => (
              <li key={s.id}>
                <TaskCard
                  titulo="Recepción de mercancía"
                  etiqueta="Entrante"
                  tono="brand"
                  meta={
                    <>
                      PyME <strong className="font-bold text-navy-900">
                        {businessById.get(s.pyme_id) ?? 'PyME'}
                      </strong>{' '}
                      · {s.packages_count} bultos
                      <br />
                      Destino: {s.warehouses?.comuna}
                    </>
                  }
                  detalle={{
                    icon: 'bultos',
                    titulo: `${s.packages_count} bultos declarados`,
                    texto: `${s.description ?? 'Sin descripción'} · ${formatNumber(Number(s.declared_volume_m3 ?? 0), 2)} m³`,
                  }}
                  accion={
                    <ButtonLink href={`/bodeguero/recepciones/${s.id}`} size="tarjeta" full>
                      Verificar y confirmar recepción
                    </ButtonLink>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="card px-5 py-8 text-center text-[13.5px] text-ink-400">
            No tienes recepciones pendientes.
          </p>
        )}
      </section>

      {/* ---------------------------------------------------------- pedidos */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold text-navy-900">Pedidos por preparar</h2>
          <Link href="/bodeguero/pedidos" className="text-[12.5px] font-bold text-brand-600 hover:underline">
            Ver todos
          </Link>
        </div>

        {orders?.length ? (
          <ul className="space-y-2.5">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href="/bodeguero/pedidos" className="card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-card">
                  <div>
                    <p className="text-[14px] font-extrabold text-navy-900">{o.code}</p>
                    <p className="text-[12.5px] text-ink-400">
                      {o.warehouses?.comuna} → {o.buyer_comuna}
                    </p>
                  </div>
                  <Badge tone={o.status === 'ready' ? 'success' : 'brand'}>
                    {LABELS.orderStatus[o.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card px-5 py-8 text-center text-[13.5px] text-ink-400">
            Nada por preparar ahora mismo.
          </p>
        )}
      </section>

      {/* -------------------------------------------------------- ocupación */}
      {spaces?.length ? (
        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">Ocupación por espacio</h2>
          <ul className="mt-5 space-y-4">
            {spaces.map((w) => {
              const usedM3 = (inventory ?? [])
                .filter((i) => i.warehouse_id === w.id)
                .reduce((s, i) => s + i.quantity * Number(i.products?.unit_volume_m3 ?? 0), 0);
              const capacity = usableCapacityM3(Number(w.total_m2));
              const pct = capacity > 0 ? Math.round((usedM3 / capacity) * 100) : 0;

              return (
                <li key={w.id}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="font-bold text-navy-900">
                      {w.comuna} · {formatNumber(Number(w.total_m2), 1)} m²
                      {w.status !== 'active' ? (
                        <Badge tone="warning" className="ml-2">
                          {LABELS.warehouseStatus[w.status]}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-ink-500 tabular-nums">
                      {formatNumber(usedM3, 2)} / {formatNumber(capacity, 1)} m³
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-line-100">
                    <div
                      className="h-full rounded-pill bg-success-600"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
