import type { Metadata } from 'next';
import { PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, usableCapacityM3 } from '@bodgo/core';

export const metadata: Metadata = { title: 'Métricas' };

/** Ventana del tablero, en días. */
const WINDOW_DAYS = 30;

export default async function MetricsPage() {
  const supabase = await createClient();
  const since = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString();

  const [{ data: orders }, { data: contracts }, { data: inventory }, { data: products }] =
    await Promise.all([
      supabase.from('orders').select('id, status, total_amount, created_at, delivered_at').gte('created_at', since),
      supabase.from('contracts').select('id, m2, total_amount, warehouse_id, warehouses(comuna)').eq('status', 'active'),
      supabase.from('inventory').select('quantity, warehouse_id, products(unit_volume_m3)'),
      supabase.from('products').select('id').eq('active', true),
    ]);

  const delivered = (orders ?? []).filter((o) => o.status === 'delivered');
  const revenue = delivered.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const monthlyCost = (contracts ?? []).reduce((s, c) => s + c.total_amount, 0);
  const totalM2 = (contracts ?? []).reduce((s, c) => s + Number(c.m2), 0);

  // Tiempo medio entre que entra la venta y sale entregada.
  const leadTimes = delivered
    .filter((o) => o.delivered_at)
    .map((o) => (new Date(o.delivered_at!).getTime() - new Date(o.created_at).getTime()) / 36e5);
  const avgLead = leadTimes.length
    ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
    : null;

  // Pedidos por semana dentro de la ventana.
  const weeks = [0, 1, 2, 3].map((w) => {
    const end = Date.now() - w * 7 * 864e5;
    const start = end - 7 * 864e5;
    const count = (orders ?? []).filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t > start && t <= end;
    }).length;
    return { label: w === 0 ? 'Esta semana' : `Hace ${w} sem`, count };
  }).reverse();

  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));

  // Ocupación real: volumen guardado contra capacidad apilable contratada.
  const occupancy = (contracts ?? []).map((c) => {
    const usedM3 = (inventory ?? [])
      .filter((i) => i.warehouse_id === c.warehouse_id)
      .reduce((s, i) => s + i.quantity * Number(i.products?.unit_volume_m3 ?? 0), 0);
    const capacity = usableCapacityM3(Number(c.m2));
    return {
      comuna: c.warehouses?.comuna ?? 'Bodega',
      usedM3: Math.round(usedM3 * 100) / 100,
      capacity,
      pct: capacity > 0 ? Math.round((usedM3 / capacity) * 100) : 0,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Métricas" subtitle={`Tablero operativo · últimos ${WINDOW_DAYS} días`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={orders?.length ?? 0} label="Pedidos recibidos" />
        <Stat value={delivered.length} label="Entregados" />
        <Stat value={formatCLP(revenue)} label="Facturado entregado" />
        <Stat
          value={avgLead != null ? `${formatNumber(avgLead, 1)} h` : '—'}
          label="Tiempo medio de entrega"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">Pedidos por semana</h2>
          <ul className="mt-5 flex h-40 items-end gap-3">
            {weeks.map((w) => (
              <li key={w.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[12px] font-extrabold text-navy-900 tabular-nums">{w.count}</span>
                <div
                  className="w-full rounded-t-[6px] bg-brand-600"
                  style={{ height: `${Math.max(4, (w.count / maxWeek) * 100)}%` }}
                  role="img"
                  aria-label={`${w.label}: ${w.count} pedidos`}
                />
                <span className="text-[10.5px] text-ink-400">{w.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold text-navy-900">Ocupación por microbodega</h2>
          <p className="mt-1 text-[12.5px] text-ink-400">
            Volumen guardado contra capacidad apilable contratada.
          </p>

          {occupancy.length === 0 ? (
            <p className="mt-6 text-[13px] text-ink-400">Todavía no arriendas ningún espacio.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {occupancy.map((o) => (
                <li key={o.comuna}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="font-bold text-navy-900">{o.comuna}</span>
                    <span className="text-ink-500 tabular-nums">
                      {formatNumber(o.usedM3, 2)} / {formatNumber(o.capacity, 1)} m³ · {o.pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-line-100">
                    <div
                      className={`h-full rounded-pill ${o.pct > 90 ? 'bg-warning-600' : 'bg-success-600'}`}
                      style={{ width: `${Math.min(100, o.pct)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Costo de almacenamiento</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Cell label="Superficie contratada" value={`${formatNumber(totalM2, 1)} m²`} />
          <Cell label="Costo mensual" value={formatCLP(monthlyCost)} />
          <Cell
            label="Costo por m²"
            value={totalM2 > 0 ? `${formatCLP(monthlyCost / totalM2)} /mes` : '—'}
          />
        </dl>
        <p className="mt-4 text-[12.5px] leading-relaxed text-ink-500">
          {products?.length ?? 0} SKUs activos en el catálogo. La comisión de plataforma del 8% ya
          está incluida en el costo mensual.
        </p>
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-surface-50 p-4">
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-[17px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
