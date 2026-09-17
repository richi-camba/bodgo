'use client';

import { useId, useState } from 'react';
import { estimateByVolume, formatCLP, GROSS_HEIGHT_M } from '@bodgo/core';

/** Atajos de volumen, para no hacer pensar en m³ a quien piensa en pallets. */
const ATAJOS = [
  { label: 'Módulo S', m3: 3 },
  { label: '1 pallet', m3: 2 },
  { label: '7 pallets', m3: 14 },
  { label: 'Bodega completa', m3: 27 },
];

/** Referencias de tamaño para que los m³ signifiquen algo concreto. */
const MODULOS = [
  { label: 'Pallets estándar', per: 2, unit: 'pallet' },
  { label: 'Cajas grandes (60×40×40)', per: 0.096, unit: 'caja' },
];

/**
 * Estimador de arriendo por volumen.
 *
 * Los m³ se eligen con el deslizador, los botones o los atajos: el mismo
 * número por tres caminos, porque quien llega sabiendo «tengo dos pallets» no
 * tiene por qué traducirlos a m³ de cabeza.
 */
export function PricingCalculator() {
  const [m3, setM3] = useState(20);
  const sliderId = useId();
  const estimacion = estimateByVolume(m3);
  const pct = ((m3 - 1) / 26) * 100;

  return (
    <div className="flex flex-wrap items-center gap-[clamp(24px,4vw,44px)] rounded-[22px] border border-line-200 bg-surface-50 p-[clamp(22px,3vw,30px)]">
      {/* ------------------------------------------------------ controles */}
      <div className="min-w-[280px] flex-[1.3]">
        <h3 className="text-[19px] font-extrabold tracking-tight text-navy-900">
          ¿Cuánto espacio necesitas?
        </h3>
        <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-500">
          Indica los m³ que ocupa tu stock y calculamos el arriendo. Un pallet estándar equivale a
          unos 2 m³. Si necesitas más de 27 m³, puedes combinar varias microbodegas.
        </p>

        <div className="mt-6 flex items-center gap-[18px]">
          <button
            type="button"
            onClick={() => setM3((v) => Math.max(1, v - 1))}
            aria-label="Quitar un metro cúbico"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-line-200 bg-white text-[24px] font-bold text-navy-800 transition-colors hover:border-navy-800 disabled:text-ink-300"
            disabled={m3 <= 1}
          >
            −
          </button>

          <p className="min-w-[96px] text-center">
            <span className="block text-[38px] font-extrabold leading-none tracking-[-1.2px] text-navy-800 tabular-nums">
              {m3}
            </span>
            <span className="mt-1 block text-[12px] font-semibold text-ink-400">m³</span>
          </p>

          <button
            type="button"
            onClick={() => setM3((v) => Math.min(27, v + 1))}
            aria-label="Agregar un metro cúbico"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-brand-50 text-[24px] font-bold text-brand-600 transition-colors hover:bg-brand-100 disabled:text-ink-300"
            disabled={m3 >= 27}
          >
            +
          </button>

          <span className="min-w-[90px] flex-1">
            <label htmlFor={sliderId} className="sr-only">
              Volumen de tu stock en metros cúbicos
            </label>
            <input
              id={sliderId}
              type="range"
              min={1}
              max={27}
              step={1}
              value={m3}
              onChange={(e) => setM3(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            {/* La barra pintada repite el valor del deslizador para que se lea
                de un vistazo también en pantallas donde el pulgar lo tapa. */}
            <span aria-hidden className="mt-1 block h-2 overflow-hidden rounded-[5px] bg-line-200">
              <span className="block h-full rounded-[5px] bg-brand-600" style={{ width: `${pct}%` }} />
            </span>
            <span className="mt-1.5 flex justify-between text-[11px] text-ink-400">
              <span>1 m³</span>
              <span>27 m³</span>
            </span>
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {ATAJOS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => setM3(a.m3)}
              aria-pressed={m3 === a.m3}
              className={`rounded-[10px] border px-3.5 py-2 text-[13px] font-bold transition-colors ${
                m3 === a.m3
                  ? 'border-brand-600 bg-brand-50 text-brand-600'
                  : 'border-line-200 bg-white text-ink-700 hover:border-navy-800'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------- resultado */}
      <div className="min-w-[250px] flex-1 rounded-[18px] bg-[linear-gradient(150deg,#16365A,#0f2742)] p-6 text-white">
        <p className="text-[12px] font-bold tracking-[0.04em] text-white/55">ARRIENDO ESTIMADO</p>
        <p className="mt-2.5 flex items-baseline gap-1">
          <span className="text-[clamp(32px,4vw,40px)] font-extrabold leading-none tracking-[-1.2px] tabular-nums">
            {formatCLP(estimacion.monthly)}
          </span>
          <span className="text-[15px] font-semibold text-white/55">/mes</span>
        </p>
        <p className="mt-1.5 text-[13px] text-white/60">o {formatCLP(estimacion.daily)} por día</p>

        <p className="mt-[18px] flex items-center justify-between gap-3 border-t border-white/[0.14] pt-4 text-[13px]">
          <span className="text-white/65">Plan sugerido</span>
          <span className="font-extrabold">{estimacion.plan}</span>
        </p>

        <p className="mt-4 text-[11px] font-bold tracking-[0.04em] text-white/50">
          A CUÁNTO EQUIVALE
        </p>
        <dl className="mt-2 space-y-2 text-[13px]">
          {MODULOS.map((mod) => (
            <div key={mod.label} className="flex items-center justify-between gap-3">
              <dt className="text-white/65">{mod.label}</dt>
              <dd className="font-bold tabular-nums">
                ≈ {Math.max(1, Math.round(m3 / mod.per))} {mod.unit}
                {Math.round(m3 / mod.per) === 1 ? '' : 's'}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-white/65">Superficie equivalente</dt>
            <dd className="font-bold tabular-nums">
              ≈ {(m3 / GROSS_HEIGHT_M).toFixed(1).replace('.', ',')} m²
            </dd>
          </div>
        </dl>

        <p className="mt-3.5 text-[11.5px] leading-[1.5] text-white/45">
          Referencia sobre {formatCLP(estimacion.ratePerM3)} por m³ al mes. El precio final depende
          de la bodega que elijas.
        </p>
      </div>
    </div>
  );
}
