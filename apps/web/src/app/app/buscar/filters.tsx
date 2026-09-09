'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useId } from 'react';
import { formatCLP } from '@bodgo/core';

const PRICE_STEPS = [30_000, 40_000, 50_000, 60_000];
const SIZE_STEPS = [1, 4, 8, 12];

export function Filters({ comunas }: { comunas: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const comunaId = useId();
  const ordenId = useId();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/app/buscar?${next.toString()}`, { scroll: false });
  }

  const hasFilters = ['comuna', 'max', 'min_m2'].some((k) => params.get(k));

  return (
    <div className="card space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={comunaId} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Comuna
          </label>
          <select
            id={comunaId}
            value={params.get('comuna') ?? ''}
            onChange={(e) => update('comuna', e.target.value)}
            className="h-10 w-full rounded-field border border-line-200 bg-white px-3 text-[13.5px] font-semibold text-navy-900"
          >
            <option value="">Todas</option>
            {comunas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={ordenId} className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Ordenar por
          </label>
          <select
            id={ordenId}
            value={params.get('orden') ?? 'rating'}
            onChange={(e) => update('orden', e.target.value)}
            className="h-10 w-full rounded-field border border-line-200 bg-white px-3 text-[13.5px] font-semibold text-navy-900"
          >
            <option value="rating">Mejor calificadas</option>
            <option value="precio">Precio más bajo</option>
            <option value="espacio">Más espacio libre</option>
          </select>
        </div>
      </div>

      <ChipRow
        legend="Precio máximo por m²"
        options={PRICE_STEPS.map((p) => ({ value: String(p), label: `hasta ${formatCLP(p)}` }))}
        active={params.get('max')}
        onPick={(v) => update('max', v)}
      />

      <ChipRow
        legend="Superficie libre mínima"
        options={SIZE_STEPS.map((s) => ({ value: String(s), label: `${s}+ m²` }))}
        active={params.get('min_m2')}
        onPick={(v) => update('min_m2', v)}
      />

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace('/app/buscar', { scroll: false })}
          className="text-[12.5px] font-bold text-brand-600 hover:underline"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}

function ChipRow({
  legend,
  options,
  active,
  onPick,
}: {
  legend: string;
  options: { value: string; label: string }[];
  active: string | null;
  onPick: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = active === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(on ? '' : o.value)}
              className={`rounded-pill px-3 py-1.5 text-[12.5px] font-bold transition-colors ${
                on ? 'bg-navy-800 text-white' : 'bg-surface-100 text-ink-700 hover:bg-line-100'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
