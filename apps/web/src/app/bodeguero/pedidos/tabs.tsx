'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

/**
 * Pestañas y filtros de estado de la bandeja del bodeguero.
 *
 * Del prototipo: dos pestañas —lo que hay que despachar y lo que hay que
 * recibir— y debajo las pastillas de estado con su cuenta. Las pastillas se
 * arman con los estados que realmente hay: ofrecer un filtro que deja la
 * lista vacía es ruido.
 */
export function OrderTabs({
  tipo,
  estado,
  estados,
  totales,
}: {
  tipo: 'enviar' | 'recibir';
  estado: string;
  estados: { id: string; label: string; count: number }[];
  totales: { enviar: number; recibir: number };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function ir(cambios: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    startTransition(() =>
      router.replace(qs ? `/bodeguero/pedidos?${qs}` : '/bodeguero/pedidos', { scroll: false }),
    );
  }

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Tipo de pedido" className="flex gap-2">
        <Pestana
          activa={tipo === 'enviar'}
          n={totales.enviar}
          onClick={() => ir({ tipo: '', estado: '' })}
        >
          Para enviar
        </Pestana>
        <Pestana
          activa={tipo === 'recibir'}
          n={totales.recibir}
          onClick={() => ir({ tipo: 'recibir', estado: '' })}
        >
          Recepción
        </Pestana>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {estados.map((e) => (
          <button
            key={e.id}
            type="button"
            aria-pressed={estado === e.id}
            onClick={() => ir({ estado: e.id === 'todos' ? '' : e.id })}
            className={`shrink-0 rounded-pill px-3.5 py-2 text-[12px] font-bold transition-colors ${
              estado === e.id ? 'bg-navy-800 text-white' : 'bg-surface-100 text-ink-700 hover:bg-line-100'
            }`}
          >
            {e.label} · {e.count}
          </button>
        ))}
      </div>
    </div>
  );
}

function Pestana({
  activa,
  n,
  onClick,
  children,
}: {
  activa: boolean;
  n: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={`flex-1 rounded-[12px] px-3 py-2.5 text-[13.5px] font-bold transition-colors ${
        activa ? 'bg-navy-800 text-white' : 'bg-white text-ink-700 hover:bg-surface-100'
      }`}
    >
      {children}
      {n > 0 ? (
        <span className={`ml-1.5 text-[12px] ${activa ? 'text-white/70' : 'text-ink-500'}`}>{n}</span>
      ) : null}
    </button>
  );
}
