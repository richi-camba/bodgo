'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Icon } from '@/components/ui/icon';

/**
 * Cambia entre lista y mapa sin perder los filtros.
 *
 * La vista viaja en la URL y no en un estado de cliente: así el enlace que
 * alguien comparte abre lo mismo que estaba mirando.
 */
export function ViewToggle({ mapa }: { mapa: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function cambiar() {
    const next = new URLSearchParams(params.toString());
    if (mapa) next.delete('vista');
    else next.set('vista', 'mapa');
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `/app/buscar?${qs}` : '/app/buscar', { scroll: false }));
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-brand-600 transition-colors hover:text-brand-700"
    >
      <Icon name={mapa ? 'lista' : 'ubicacion'} size={15} />
      {mapa ? 'Lista' : 'Mapa'}
    </button>
  );
}
