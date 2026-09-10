'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { StickyBar } from '@/components/app/step-header';
import { formatCLP, formatNumber, usableCapacityM3 } from '@bodgo/core';

/**
 * Paso 1: cuántos m² se contratan.
 *
 * El prototipo combina el más/menos con un deslizador, y muestra el arriendo
 * base —sin comisión— en la tarjeta navy. La comisión aparece recién en el
 * resumen, que es donde se paga: mostrarla acá obligaría a leer dos números
 * mientras todavía se está eligiendo el tamaño.
 */
export function SizeStep({
  warehouseId,
  comuna,
  bodeguero,
  totalM2,
  availableM2,
  pricePerM2,
  photo,
}: {
  warehouseId: string;
  comuna: string;
  bodeguero: string;
  totalM2: number;
  availableM2: number;
  pricePerM2: number;
  photo: string | null;
}) {
  const router = useRouter();
  const maxM2 = Math.max(1, Math.floor(availableM2));
  const [m2, setM2] = useState(() => Math.min(2, maxM2));
  const sliderId = useId();

  const base = m2 * pricePerM2;
  const sinEspacio = availableM2 < 1;

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------ bodega elegida */}
      <div className="flex items-center gap-3 rounded-[16px] bg-white p-3">
        {/* Sin foto va el rayado del prototipo: se lee como «acá falta una
            imagen» y no compite con el nombre de la comuna. */}
        <span className="relative block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[12px] bg-rayado">
          {photo ? <Image src={photo} alt="" fill sizes="52px" className="object-cover" /> : null}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-navy-900">{comuna}</p>
          <p className="text-[12.5px] text-ink-500">
            {formatNumber(totalM2, 0)} m² · {bodeguero}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-[15px] font-extrabold text-navy-900">¿Cuántos m² necesitas?</h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Disponibles en esta bodega:{' '}
          <strong className="font-bold text-navy-900">{formatNumber(availableM2, 1)} m²</strong> ·{' '}
          {formatCLP(pricePerM2)} / m² al mes
        </p>
      </div>

      {sinEspacio ? (
        <p className="rounded-card border border-danger-600/25 bg-danger-50 p-4 text-[13.5px] text-danger-700">
          Esta microbodega está completa. Vuelve al buscador para ver otras de la red.
        </p>
      ) : (
        <>
          {/* --------------------------------------------- selector */}
          <div className="rounded-[16px] bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14.5px] font-bold text-navy-900">Metros cuadrados</p>
                <p className="text-[12px] text-ink-500">Contratación mensual</p>
              </div>

              <div className="flex items-center gap-3">
                <Paso
                  label="Quitar un metro cuadrado"
                  onClick={() => setM2((v) => Math.max(1, v - 1))}
                  disabled={m2 <= 1}
                >
                  −
                </Paso>
                <p className="w-12 text-center">
                  <span className="block text-[24px] font-extrabold leading-none text-navy-900 tabular-nums">
                    {m2}
                  </span>
                  <span className="block text-[11px] text-ink-500">m²</span>
                </p>
                <Paso
                  label="Agregar un metro cuadrado"
                  onClick={() => setM2((v) => Math.min(maxM2, v + 1))}
                  disabled={m2 >= maxM2}
                >
                  +
                </Paso>
              </div>
            </div>

            <label htmlFor={sliderId} className="sr-only">
              Metros cuadrados a contratar
            </label>
            <input
              id={sliderId}
              type="range"
              min={1}
              max={maxM2}
              step={1}
              value={m2}
              onChange={(e) => setM2(Number(e.target.value))}
              className="mt-4 w-full accent-brand-600"
            />
            <div className="mt-1 flex justify-between text-[11.5px] text-ink-500">
              <span>1 m²</span>
              <span>{formatNumber(availableM2, 1)} m² disp.</span>
            </div>
          </div>

          {/* ------------------------------------------------ arriendo */}
          <div className="flex items-center justify-between gap-4 rounded-[16px] bg-navy-800 p-5 text-white">
            <div>
              <p className="text-[13.5px] font-bold">Arriendo mensual</p>
              <p className="text-[12px] text-white/70">
                {m2} m² × {formatCLP(pricePerM2)}
              </p>
            </div>
            <p className="text-[26px] font-extrabold leading-none tabular-nums">{formatCLP(base)}</p>
          </div>

          <div className="flex gap-3 rounded-[14px] bg-brand-50 p-4">
            <span className="mt-0.5 shrink-0 text-brand-600">
              <Icon name="seguro" size={16} />
            </span>
            <p className="text-[12.5px] leading-relaxed text-navy-800">
              Contratación mensual con cobro recurrente. Equivale a{' '}
              {formatNumber(usableCapacityM3(m2), 1)} m³ apilables. En el siguiente paso ves el
              resumen y pagas.
            </p>
          </div>

          <StickyBar etiqueta={`${m2} m² · mensual`} valor={formatCLP(base)}>
            <Button
              size="lg"
              full
              onClick={() =>
                router.push(`/app/buscar/${warehouseId}/contratar/resumen?m2=${m2}`)
              }
            >
              Ver resumen
            </Button>
          </StickyBar>
        </>
      )}
    </div>
  );
}

function Paso({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-surface-100 text-[19px] font-bold text-navy-800 transition-colors hover:bg-line-100 disabled:text-line-300 disabled:hover:bg-surface-100"
    >
      {children}
    </button>
  );
}
