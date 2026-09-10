import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS, usableCapacityM3 } from '@bodgo/core';
import { ExportButton, type Fila } from './export-button';

export const metadata: Metadata = { title: 'Métricas' };

/** Ventana del tablero, en días. */
const WINDOW_DAYS = 30;

/** Variación contra el periodo anterior, sólo si hay con qué comparar. */
function delta(ahora: number, antes: number) {
  if (antes === 0) return ahora > 0 ? { texto: 'nuevo en el periodo', tono: 'sube' as const } : null;
  const pct = Math.round(((ahora - antes) / antes) * 100);
  if (pct === 0) return { texto: 'igual que el periodo anterior', tono: 'igual' as const };
  return {
    texto: `${pct > 0 ? '+' : ''}${pct}% vs. periodo anterior`,
    tono: pct > 0 ? ('sube' as const) : ('baja' as const),
  };
}

export default async function MetricsPage() {
  const supabase = await createClient();
  const ahora = Date.now();
  const desde = new Date(ahora - WINDOW_DAYS * 864e5).toISOString();
  const desdeAnterior = new Date(ahora - 2 * WINDOW_DAYS * 864e5).toISOString();

  const [{ data: todos }, { data: contracts }, { data: inventory }, { data: products }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('id, code, status, total_amount, shipping_cost, buyer_comuna, created_at, delivered_at, warehouses(comuna)')
        .gte('created_at', desdeAnterior)
        .order('created_at', { ascending: false }),
      supabase
        .from('contracts')
        .select('id, m2, total_amount, warehouse_id, warehouses(comuna)')
        .eq('status', 'active'),
      supabase.from('inventory').select('quantity, warehouse_id, products(unit_volume_m3)'),
      supabase.from('products').select('id').eq('active', true),
    ]);

  const enVentana = (todos ?? []).filter((o) => o.created_at >= desde);
  const anteriores = (todos ?? []).filter((o) => o.created_at < desde);

  const entregados = enVentana.filter((o) => o.status === 'delivered');
  const entregadosAntes = anteriores.filter((o) => o.status === 'delivered');
  const facturado = entregados.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const facturadoAntes = entregadosAntes.reduce((s, o) => s + (o.total_amount ?? 0), 0);

  const costoMensual = (contracts ?? []).reduce((s, c) => s + c.total_amount, 0);
  const totalM2 = (contracts ?? []).reduce((s, c) => s + Number(c.m2), 0);

  // Tiempo medio entre que entra la venta y sale entregada.
  const horas = entregados
    .filter((o) => o.delivered_at)
    .map((o) => (new Date(o.delivered_at!).getTime() - new Date(o.created_at).getTime()) / 36e5);
  const medio = horas.length ? horas.reduce((a, b) => a + b, 0) / horas.length : null;

  const KPIS = [
    {
      label: 'Pedidos recibidos',
      value: formatNumber(enVentana.length),
      delta: delta(enVentana.length, anteriores.length),
    },
    {
      label: 'Entregados',
      value: formatNumber(entregados.length),
      delta: delta(entregados.length, entregadosAntes.length),
    },
    {
      label: 'Facturado entregado',
      value: formatCLP(facturado),
      delta: delta(facturado, facturadoAntes),
    },
    {
      label: 'Tiempo medio de entrega',
      value: medio != null ? `${formatNumber(medio, 1)} h` : '—',
      delta: null,
    },
    {
      label: 'Costo de almacenamiento',
      value: formatCLP(costoMensual),
      delta: null,
    },
    {
      label: 'SKUs activos',
      value: formatNumber(products?.length ?? 0),
      delta: null,
    },
  ];

  // Pedidos por semana dentro de la ventana.
  const semanas = [0, 1, 2, 3]
    .map((w) => {
      const fin = ahora - w * 7 * 864e5;
      const inicio = fin - 7 * 864e5;
      const n = enVentana.filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t > inicio && t <= fin;
      }).length;
      return { label: w === 0 ? 'Esta sem' : `−${w} sem`, n };
    })
    .reverse();

  const tope = Math.max(1, ...semanas.map((s) => s.n));

  // Ocupación real: volumen guardado contra capacidad apilable contratada.
  const ocupacion = (contracts ?? []).map((c) => {
    const usadoM3 = (inventory ?? [])
      .filter((i) => i.warehouse_id === c.warehouse_id)
      .reduce((s, i) => s + i.quantity * Number(i.products?.unit_volume_m3 ?? 0), 0);
    const capacidad = usableCapacityM3(Number(c.m2));
    return {
      comuna: c.warehouses?.comuna ?? 'Bodega',
      usadoM3: Math.round(usadoM3 * 100) / 100,
      capacidad,
      pct: capacidad > 0 ? Math.round((usadoM3 / capacidad) * 100) : 0,
    };
  });

  const filas: Fila[] = enVentana.map((o) => ({
    Pedido: o.code,
    Estado: LABELS.orderStatus[o.status],
    Bodega: o.warehouses?.comuna ?? '',
    'Comuna de entrega': o.buyer_comuna,
    Total: o.total_amount ?? 0,
    'Envío cobrado': o.shipping_cost ?? 0,
    Creado: new Date(o.created_at).toLocaleDateString('es-CL'),
    Entregado: o.delivered_at ? new Date(o.delivered_at).toLocaleDateString('es-CL') : '',
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="Métricas" subtitle={`Tablero operativo · últimos ${WINDOW_DAYS} días`} />

      <div className="grid grid-cols-2 gap-3">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-[16px] border border-line-100 bg-white p-3.5">
            <p className="text-[11px] font-semibold leading-tight text-ink-500">{k.label}</p>
            <p className="mt-1.5 text-[24px] font-extrabold leading-none tracking-tight text-navy-800 tabular-nums">
              {k.value}
            </p>
            {k.delta ? (
              <p
                className={`mt-1 text-[11px] font-bold ${
                  k.delta.tono === 'sube'
                    ? 'text-success-700'
                    : k.delta.tono === 'baja'
                      ? 'text-danger-700'
                      : 'text-ink-500'
                }`}
              >
                {k.delta.texto}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <section className="card p-4">
        <h2 className="text-[14px] font-bold text-navy-900">Pedidos por semana</h2>
        <p className="mt-0.5 text-[12px] text-ink-500">Rotación de tu stock en la red</p>

        <ul className="mt-[18px] flex h-[130px] items-end justify-between gap-2">
          {semanas.map((s) => (
            <li key={s.label} className="flex h-full flex-1 flex-col items-center justify-end gap-[7px]">
              <span className="text-[11px] font-bold text-navy-800 tabular-nums">{s.n}</span>
              <div
                role="img"
                aria-label={`${s.label}: ${s.n} pedidos`}
                className="w-full rounded-t-[7px] bg-brand-600"
                style={{ height: `${Math.max(3, (s.n / tope) * 100)}%` }}
              />
              <span className="text-[10px] text-ink-500">{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4">
        <h2 className="text-[14px] font-bold text-navy-900">Ocupación por bodega</h2>
        <p className="mt-0.5 text-[12px] text-ink-500">
          Volumen guardado contra capacidad apilable contratada
        </p>

        {ocupacion.length === 0 ? (
          <p className="mt-4 text-[12.5px] text-ink-500">Todavía no arriendas ningún espacio.</p>
        ) : (
          <ul className="mt-3.5 space-y-3.5">
            {ocupacion.map((o) => (
              <li key={o.comuna}>
                <div className="mb-[7px] flex justify-between text-[12px]">
                  <span className="font-semibold text-ink-700">{o.comuna}</span>
                  <span className="font-bold text-navy-800 tabular-nums">
                    {formatNumber(o.usadoM3, 2)} / {formatNumber(o.capacidad, 1)} m³ · {o.pct}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={Math.min(100, o.pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Ocupación en ${o.comuna}`}
                  className="h-2 overflow-hidden rounded-pill bg-line-100"
                >
                  <div
                    className={`h-full rounded-pill ${o.pct > 90 ? 'bg-warning-600' : 'bg-success-600'}`}
                    style={{ width: `${Math.min(100, o.pct)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 border-t border-line-100 pt-3.5 text-[12px] leading-relaxed text-ink-500">
          {formatNumber(totalM2, 1)} m² contratados ·{' '}
          {totalM2 > 0 ? `${formatCLP(Math.round(costoMensual / totalM2))} por m² al mes` : 'sin contratos'}
          . La comisión de plataforma del 8% ya está incluida.
        </p>
      </section>

      <ExportButton filas={filas} nombre="bodgo-pedidos" />
    </div>
  );
}
