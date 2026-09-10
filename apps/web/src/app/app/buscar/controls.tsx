'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { formatCLP } from '@bodgo/core';

const PRECIOS = [30_000, 40_000, 50_000, 60_000];

/**
 * Buscador y filtros.
 *
 * El orden por cercanía sólo aparece si la PyME tiene comuna cargada: sin
 * origen no hay contra qué medir, y una opción que no ordena nada es peor que
 * no ofrecerla.
 */
export function SearchControls({
  comunas,
  tieneOrigen,
}: {
  comunas: string[];
  tieneOrigen: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const [texto, setTexto] = useState(params.get('q') ?? '');
  const [abierto, setAbierto] = useState(false);

  function actualizar(cambios: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => router.replace(`/app/buscar?${next.toString()}`, { scroll: false }));
  }

  const orden = params.get('orden') ?? (tieneOrigen ? 'cercania' : 'rating');
  const hayFiltros = ['comuna', 'max', 'q'].some((k) => params.get(k));

  const ORDENES = [
    ...(tieneOrigen ? [{ id: 'cercania', label: 'Cercanía' }] : []),
    { id: 'rating', label: 'Mejor calificadas' },
    { id: 'precio', label: 'Menor precio' },
    { id: 'espacio', label: 'Más espacio' },
  ];

  return (
    <div className="space-y-3">
      {/* --------------------------------------------------- búsqueda */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          actualizar({ q: texto });
        }}
        className="flex gap-2"
      >
        <span className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
            <Icon name="buscar" size={16} />
          </span>
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Comuna, sector o bodeguero…"
            aria-label="Buscar microbodegas"
            className="h-11 w-full rounded-field border border-line-200 bg-white pl-10 pr-3 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
          />
        </span>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-field border transition-colors ${
            abierto || hayFiltros
              ? 'border-navy-800 bg-navy-800 text-white'
              : 'border-line-200 bg-white text-ink-700 hover:border-navy-800'
          }`}
        >
          <Icon name="filtros" size={17} label="Filtros" />
        </button>
      </form>

      {/* ---------------------------------------------------- filtros */}
      {abierto ? (
        <div className="card space-y-4 p-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">Comuna</p>
            <div className="flex flex-wrap gap-2">
              <Chip activo={!params.get('comuna')} onClick={() => actualizar({ comuna: '' })}>
                Todas
              </Chip>
              {comunas.map((c) => (
                <Chip
                  key={c}
                  activo={params.get('comuna') === c}
                  onClick={() => actualizar({ comuna: params.get('comuna') === c ? '' : c })}
                >
                  {c}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-500">
              Precio máximo por m²
            </p>
            <div className="flex flex-wrap gap-2">
              {PRECIOS.map((p) => (
                <Chip
                  key={p}
                  activo={params.get('max') === String(p)}
                  onClick={() => actualizar({ max: params.get('max') === String(p) ? '' : String(p) })}
                >
                  hasta {formatCLP(p)}
                </Chip>
              ))}
            </div>
          </div>

          {hayFiltros ? (
            <button
              type="button"
              onClick={() => {
                setTexto('');
                startTransition(() => router.replace('/app/buscar', { scroll: false }));
              }}
              className="text-[12.5px] font-bold text-brand-600 hover:underline"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ----------------------------------------------------- orden */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {ORDENES.map((o) => (
          <Chip key={o.id} activo={orden === o.id} onClick={() => actualizar({ orden: o.id })}>
            {o.label}
          </Chip>
        ))}
      </div>

      {pendiente ? <p className="sr-only" role="status">Actualizando resultados…</p> : null}
    </div>
  );
}
