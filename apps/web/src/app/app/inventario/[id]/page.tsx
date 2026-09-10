import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Icon } from '@/components/ui/icon';
import { StepHeader } from '@/components/app/step-header';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, stockPercent, stockStatus, unitsToTarget } from '@bodgo/core';

export const metadata: Metadata = { title: 'Producto' };

const MOVIMIENTO = {
  inbound: { titulo: 'Entrada', signo: '+', color: 'text-success-700', fondo: 'bg-success-50 text-success-700', icono: 'recibido' },
  outbound: { titulo: 'Salida', signo: '−', color: 'text-danger-700', fondo: 'bg-danger-50 text-danger-700', icono: 'envios' },
  transfer: { titulo: 'Transferencia', signo: '', color: 'text-brand-600', fondo: 'bg-brand-50 text-brand-600', icono: 'recurrente' },
  adjustment: { titulo: 'Ajuste', signo: '', color: 'text-warning-700', fondo: 'bg-warning-50 text-warning-700', icono: 'discrepancias' },
} as const;

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('id, name, sku, category, unit_volume_m3, target_stock')
    .eq('id', id)
    .maybeSingle();

  if (!product) notFound();

  const [{ data: places }, { data: movements }, { data: counts }] = await Promise.all([
    supabase
      .from('inventory')
      .select('quantity, position_label, warehouses(comuna)')
      .eq('product_id', id),
    supabase
      .from('stock_movements')
      .select('id, type, quantity, note, created_at, warehouses(comuna)')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('stock_counts')
      .select('digital_qty, physical_qty, delta, counted_at')
      .eq('product_id', id)
      .order('counted_at', { ascending: false })
      .limit(1),
  ]);

  const stock = (places ?? []).reduce((s, p) => s + p.quantity, 0);
  const estado = stockStatus(stock, product.target_stock);
  const conteo = counts?.[0] ?? null;
  const faltan = unitsToTarget(stock, product.target_stock);

  const colorStock =
    estado === 'agotado' ? 'text-danger-700'
    : estado === 'bajo' ? 'text-warning-700'
    : estado === 'ok' ? 'text-success-700'
    : 'text-navy-800';

  return (
    <div className="space-y-5">
      {/* La ficha se mira, no es un flujo que haya que terminar: la barra de
          pestañas se queda, como en el prototipo. */}
      <StepHeader
        titulo={product.name}
        volverA="/app/inventario"
        tomaLaPantalla={false}
        subtitulo={
          <span className="font-mono">
            {product.sku}
            {product.category ? ` · ${product.category}` : ''}
          </span>
        }
        accion={
          <Link
            href={`/app/inventario/${product.id}/editar`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line-200 bg-white text-navy-800 transition-colors hover:border-navy-800"
          >
            <Icon name="editar" size={17} label="Editar producto" />
          </Link>
        }
      />

      {/* ----------------------------------------------------------- cifras */}
      <div className="flex gap-2.5">
        <Caja rotulo="Stock total" valor={formatNumber(stock)} color={colorStock} />
        <Caja rotulo="Ubicaciones" valor={String((places ?? []).length)} />
        <Caja
          rotulo="Objetivo"
          valor={product.target_stock ? formatNumber(product.target_stock) : '—'}
        />
      </div>

      {product.target_stock ? (
        <div className="card p-4">
          <div className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="text-ink-500">
              {faltan > 0
                ? `Faltan ${formatNumber(faltan)} unidades para tu objetivo`
                : 'Al día con tu objetivo'}
            </span>
            <span className={`font-extrabold ${colorStock}`}>
              {stockPercent(stock, product.target_stock)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={stockPercent(stock, product.target_stock)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Cobertura del stock objetivo"
            className="mt-2 h-2 overflow-hidden rounded-pill bg-line-100"
          >
            <div
              className={`h-full rounded-pill ${
                estado === 'agotado' ? 'bg-danger-600' : estado === 'bajo' ? 'bg-warning-600' : 'bg-success-600'
              }`}
              style={{ width: `${stockPercent(stock, product.target_stock)}%` }}
            />
          </div>
        </div>
      ) : null}

      <Link
        href="/app/despachos/nuevo"
        className="flex items-center justify-center gap-2 rounded-[13px] bg-navy-800 p-3.5 text-[14px] font-bold text-white transition-colors hover:bg-navy-950"
      >
        <Icon name="envios" size={17} />
        Reponer stock
      </Link>

      {/* ------------------------------------------------------ ubicaciones */}
      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-navy-900">Stock por ubicación</h2>

        {places?.length ? (
          <ul className="space-y-2.5">
            {places.map((p) => (
              <li
                key={`${p.warehouses?.comuna}-${p.position_label}`}
                className="flex items-center gap-3 rounded-[14px] border border-line-100 bg-white p-3.5"
              >
                <span
                  aria-hidden
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-rayado text-brand-400"
                >
                  <Icon name="bodegas" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-navy-900">{p.warehouses?.comuna}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-500">
                    {p.position_label ? `Posición ${p.position_label}` : 'Sin posición asignada'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-extrabold text-navy-800 tabular-nums">
                    {formatNumber(p.quantity)}
                  </p>
                  <p className="text-[10px] text-ink-500">unidades</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[14px] border border-line-100 bg-white p-4 text-[12.5px] leading-relaxed text-ink-500">
            Este producto todavía no está en ninguna bodega. El stock se suma cuando el bodeguero
            confirma la recepción de un envío.
          </p>
        )}
      </section>

      {/* --------------------------------------------------- reconciliación */}
      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-navy-900">Reconciliación (auditoría)</h2>

        <div className="card p-4">
          {conteo ? (
            <>
              <Linea rotulo="Stock digital" valor={`${formatNumber(conteo.digital_qty)} u`} />
              <Linea rotulo="Conteo físico" valor={`${formatNumber(conteo.physical_qty)} u`} />
              <hr className="my-3 border-line-100" />
              <p
                className={`flex items-center gap-2.5 rounded-[11px] p-3 text-[12px] font-bold ${
                  conteo.delta === 0 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                }`}
              >
                <span className="shrink-0">
                  <Icon name={conteo.delta === 0 ? 'listo' : 'discrepancias'} size={15} />
                </span>
                {conteo.delta === 0
                  ? 'Sin diferencias · auditoría al día'
                  : `Diferencia de ${Math.abs(conteo.delta ?? 0)} u · requiere revisión`}
              </p>
              <p className="mt-2.5 text-[11px] text-ink-500">
                Contado el {new Date(conteo.counted_at).toLocaleDateString('es-CL')}
              </p>
            </>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-ink-500">
              Todavía no hay un conteo físico de este producto. El stock que ves es el digital: lo
              que sumaron las recepciones menos lo que salió en pedidos.
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------ movimientos */}
      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-navy-900">Movimientos recientes</h2>

        {movements?.length ? (
          <ul className="space-y-2.5">
            {movements.map((m) => {
              const tipo = MOVIMIENTO[m.type];
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-[14px] border border-line-100 bg-white p-3.5"
                >
                  <span
                    aria-hidden
                    className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] ${tipo.fondo}`}
                  >
                    <Icon name={tipo.icono} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-navy-900">{tipo.titulo}</p>
                    <p className="mt-px truncate text-[11px] text-ink-500">
                      {[m.note, m.warehouses?.comuna].filter(Boolean).join(' · ')} ·{' '}
                      {new Date(m.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[14px] font-extrabold tabular-nums ${tipo.color}`}>
                    {tipo.signo}
                    {formatNumber(Math.abs(m.quantity))} u
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[14px] border border-line-100 bg-white p-4 text-[12.5px] text-ink-500">
            Sin movimientos todavía.
          </p>
        )}
      </section>
    </div>
  );
}

function Caja({ rotulo, valor, color = 'text-navy-800' }: { rotulo: string; valor: string; color?: string }) {
  return (
    <div className="flex-1 rounded-[14px] border border-line-100 bg-white p-3.5">
      <p className="text-[11px] font-semibold text-ink-500">{rotulo}</p>
      <p className={`mt-1 text-[20px] font-extrabold tabular-nums ${color}`}>{valor}</p>
    </div>
  );
}

function Linea({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-500">{rotulo}</span>
      <span className="font-bold text-navy-900">{valor}</span>
    </div>
  );
}
