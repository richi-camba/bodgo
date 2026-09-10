'use client';

import { useId, useState } from 'react';
import { calculateHostPayout, formatCLP, formatNumber, HOST_COMMISSION_RATE, usableCapacityM3 } from '@bodgo/core';

/**
 * Cuánto ganaría un bodeguero con su espacio.
 *
 * Muestra el neto, no el bruto: lo que le importa a quien decide es lo que le
 * llega a la cuenta, y la comisión aparece en el desglose en vez de
 * esconderse en la letra chica.
 */
export function HostEarnings({ defaultPricePerM2 }: { defaultPricePerM2: number }) {
  const [m2, setM2] = useState(12);
  const [precio, setPrecio] = useState(defaultPricePerM2);
  const m2Id = useId();
  const precioId = useId();

  const bruto = m2 * precio;
  const pago = calculateHostPayout(bruto);

  return (
    <div className="rounded-[20px] border border-white/12 bg-white/[0.06] p-6 backdrop-blur-sm md:p-8">
      <h3 className="text-[19px] font-extrabold tracking-tight text-white">
        ¿Cuánto podrías ganar?
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-white/70">
        Mueve los controles según el espacio que tengas y lo que cobres por metro.
      </p>

      <div className="mt-7 space-y-6">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={m2Id} className="text-[12.5px] font-bold text-white/70">
              Superficie disponible
            </label>
            <span className="text-[17px] font-extrabold text-white tabular-nums">{m2} m²</span>
          </div>
          <input
            id={m2Id}
            type="range"
            min={4}
            max={20}
            step={1}
            value={m2}
            onChange={(e) => setM2(Number(e.target.value))}
            className="mt-2.5 w-full accent-brand-400"
          />
          <p className="mt-1 text-[11.5px] text-white/70">
            {formatNumber(usableCapacityM3(m2), 1)} m³ apilables · unos{' '}
            {Math.round(usableCapacityM3(m2) / 2)} pallets
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={precioId} className="text-[12.5px] font-bold text-white/70">
              Precio por m² al mes
            </label>
            <span className="text-[17px] font-extrabold text-white tabular-nums">
              {formatCLP(precio)}
            </span>
          </div>
          <input
            id={precioId}
            type="range"
            min={25_000}
            max={65_000}
            step={1_000}
            value={precio}
            onChange={(e) => setPrecio(Number(e.target.value))}
            className="mt-2.5 w-full accent-brand-400"
          />
          <p className="mt-1 text-[11.5px] text-white/70">
            Lo fijas tú. El promedio de la red anda por los {formatCLP(defaultPricePerM2)}.
          </p>
        </div>
      </div>

      <dl className="mt-8 space-y-2.5 border-t border-white/15 pt-6 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-white/70">Arriendo con el espacio lleno</dt>
          <dd className="font-bold text-white tabular-nums">{formatCLP(pago.gross)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-white/70">
            Comisión BodGo ({Math.round(HOST_COMMISSION_RATE * 100)}%)
          </dt>
          <dd className="font-bold text-white tabular-nums">−{formatCLP(pago.commission)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
          <dt className="text-[15px] font-extrabold text-white">Recibes cada mes</dt>
          <dd className="text-[26px] font-extrabold text-white tabular-nums">
            {formatCLP(pago.net)}
          </dd>
        </div>
      </dl>

      <p className="mt-5 text-[12px] leading-relaxed text-white/70">
        Es el máximo con el espacio arrendado completo. Si sólo se ocupa la mitad, cobras la mitad:
        se paga por los metros efectivamente contratados.
      </p>
    </div>
  );
}
