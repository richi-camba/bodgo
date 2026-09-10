'use client';

import { useId, useState } from 'react';
import { estimateByVolume, formatCLP, GROSS_HEIGHT_M } from '@bodgo/core';

/** Referencias de tamaño para que los m³ signifiquen algo concreto. */
const MODULES = [
  { label: 'Pallets estándar', per: 2, unit: 'pallet' },
  { label: 'Cajas grandes (60×40×40)', per: 0.096, unit: 'caja' },
];

export function PricingCalculator() {
  const [m3, setM3] = useState(20);
  const sliderId = useId();
  const estimate = estimateByVolume(m3);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h3 className="text-[19px] font-extrabold tracking-tight text-white">
          ¿Cuánto espacio necesitas?
        </h3>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/70">
          Indica los m³ que ocupa tu stock y calculamos el arriendo. Un pallet estándar equivale a
          unos 2 m³. Si necesitas más de 27 m³, puedes combinar varias microbodegas.
        </p>

        <div className="mt-8">
          <div className="flex items-baseline gap-2">
            <span className="text-[44px] font-extrabold leading-none text-white tabular-nums">
              {m3}
            </span>
            <span className="text-[18px] font-bold text-white/65">m³</span>
          </div>

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
            className="mt-5 w-full accent-brand-400"
          />
          <div className="mt-1 flex justify-between text-[11px] font-semibold text-white/70">
            <span>1 m³</span>
            <span>27 m³</span>
          </div>
        </div>

        <dl className="mt-8 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">
            Módulos que ocupas
          </p>
          {MODULES.map((mod) => (
            <div key={mod.label} className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <dt className="text-[13.5px] text-white/70">{mod.label}</dt>
              <dd className="text-[13.5px] font-bold text-white tabular-nums">
                ≈ {Math.max(1, Math.round(m3 / mod.per))} {mod.unit}
                {Math.round(m3 / mod.per) === 1 ? '' : 's'}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <dt className="text-[13.5px] text-white/70">Superficie equivalente</dt>
            <dd className="text-[13.5px] font-bold text-white tabular-nums">
              ≈ {(m3 / GROSS_HEIGHT_M).toFixed(1).replace('.', ',')} m²
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-[20px] border border-white/12 bg-white/[0.06] p-7 backdrop-blur-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/70">
          Arriendo estimado
        </p>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[38px] font-extrabold leading-none text-white tabular-nums">
            {formatCLP(estimate.monthly)}
          </span>
          <span className="text-[15px] font-semibold text-white/70">/mes</span>
        </p>
        <p className="mt-1.5 text-[13px] text-white/65">
          o {formatCLP(estimate.daily)} por día
        </p>

        <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-[13.5px]">
          <Row label="Plan sugerido" value={estimate.plan} />
          <Row label="Referencia" value={`${formatCLP(estimate.ratePerM3)} / m³ al mes`} />
        </div>

        <p className="mt-6 text-[12px] leading-relaxed text-white/65">
          El precio final depende de la bodega que elijas. Incluye pago en custodia y seguro de
          contenido, sin costo de instalación.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/70">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
