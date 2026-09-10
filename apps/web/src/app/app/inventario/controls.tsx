'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';

/**
 * Buscador y filtros del inventario.
 *
 * Del prototipo: la caja de búsqueda por nombre o SKU y, debajo, las pastillas
 * de bodega. Filtrar por bodega cambia lo que significa la cifra de cada
 * producto —pasa a ser el stock en ese espacio—, así que la lista lo dice.
 */
export function InventoryControls({
  comunas,
  categorias,
}: {
  comunas: string[];
  categorias: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [texto, setTexto] = useState(params.get('q') ?? '');

  function actualizar(cambios: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    startTransition(() =>
      router.replace(qs ? `/app/inventario?${qs}` : '/app/inventario', { scroll: false }),
    );
  }

  const bodega = params.get('bodega') ?? '';
  const categoria = params.get('cat') ?? '';

  return (
    <div className="space-y-2.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          actualizar({ q: texto });
        }}
      >
        <span className="relative block">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
            <Icon name="buscar" size={16} />
          </span>
          <input
            type="search"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              if (!e.target.value) actualizar({ q: '' });
            }}
            placeholder="Buscar por nombre o SKU"
            aria-label="Buscar en el inventario"
            className="h-11 w-full rounded-field border border-line-200 bg-white pl-10 pr-3 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
          />
        </span>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <Chip activo={!bodega} onClick={() => actualizar({ bodega: '' })}>
          Todas las bodegas
        </Chip>
        {comunas.map((c) => (
          <Chip key={c} activo={bodega === c} onClick={() => actualizar({ bodega: bodega === c ? '' : c })}>
            {c}
          </Chip>
        ))}
      </div>

      {categorias.length > 1 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <Chip activo={!categoria} onClick={() => actualizar({ cat: '' })}>
            Todas las categorías
          </Chip>
          {categorias.map((c) => (
            <Chip key={c} activo={categoria === c} onClick={() => actualizar({ cat: categoria === c ? '' : c })}>
              {c}
            </Chip>
          ))}
        </div>
      ) : null}

      {pendiente ? (
        <p className="sr-only" role="status">
          Actualizando el inventario…
        </p>
      ) : null}
    </div>
  );
}
