'use client';

import Link from 'next/link';
import { StickyBar } from '@/components/app/step-header';
import { formatCLP } from '@bodgo/core';

/**
 * Barra fija del detalle: precio desde, y el paso a contratar.
 *
 * Sin tarjeta guardada el botón lleva al perfil en vez de a un flujo que se
 * va a trancar en el último paso.
 */
export function ContractBar({
  warehouseId,
  pricePerM2,
  availableM2,
  tieneTarjeta,
}: {
  warehouseId: string;
  pricePerM2: number;
  availableM2: number;
  tieneTarjeta: boolean;
}) {
  const lleno = availableM2 < 1;

  if (lleno) {
    return (
      <StickyBar>
        <Link
          href="/app/buscar"
          className="flex h-13 w-full items-center justify-center rounded-field border border-line-200 bg-white text-[15px] font-bold text-navy-800"
        >
          Sin espacio · ver otras bodegas
        </Link>
      </StickyBar>
    );
  }

  return (
    <StickyBar etiqueta="Desde" valor={`${formatCLP(pricePerM2)}/m²`}>
      <Link
        href={tieneTarjeta ? `/app/buscar/${warehouseId}/contratar` : '/app/perfil'}
        className="flex h-13 w-full items-center justify-center rounded-field bg-navy-800 text-[15px] font-bold text-white transition-colors hover:bg-navy-950"
      >
        {tieneTarjeta ? 'Contratar bodega' : 'Agregar tarjeta para contratar'}
      </Link>
    </StickyBar>
  );
}
