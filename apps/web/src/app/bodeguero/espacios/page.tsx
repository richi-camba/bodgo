import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, type Tone } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Mis espacios' };

const TONE: Record<string, Tone> = {
  draft: 'neutral',
  pending_review: 'warning',
  active: 'success',
  paused: 'neutral',
  rejected: 'danger',
};

export default async function SpacesPage() {
  const supabase = await createClient();

  const [{ data: spaces }, { data: contracts }, { data: inventory }, { data: photos }] =
    await Promise.all([
      supabase.from('warehouses').select('*').order('created_at'),
      supabase.from('contracts').select('warehouse_id, m2').eq('status', 'active'),
      supabase.from('inventory').select('warehouse_id, product_id').gt('quantity', 0),
      supabase.from('warehouse_photos').select('warehouse_id, storage_path').order('sort_order'),
    ]);

  const arrendados = new Map<string, number>();
  for (const c of contracts ?? []) {
    arrendados.set(c.warehouse_id, (arrendados.get(c.warehouse_id) ?? 0) + Number(c.m2));
  }

  const skus = new Map<string, Set<string>>();
  for (const i of inventory ?? []) {
    const set = skus.get(i.warehouse_id) ?? new Set<string>();
    set.add(i.product_id);
    skus.set(i.warehouse_id, set);
  }

  const foto = new Map<string, string>();
  for (const p of photos ?? []) {
    if (!foto.has(p.warehouse_id)) foto.set(p.warehouse_id, p.storage_path);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mis espacios"
        subtitle="Microbodegas publicadas en la red"
        action={
          <ButtonLink href="/bodeguero/espacios/nuevo" size="sm">
            Publicar espacio
          </ButtonLink>
        }
      />

      {!spaces?.length ? (
        <EmptyState
          icon="espacios"
          title="Todavía no publicaste ningún espacio"
          body="Publica tu microbodega, un evaluador de BodGo agenda la visita de habilitación y, una vez aprobada, aparece en el buscador de las PyMEs."
          action={<ButtonLink href="/bodeguero/espacios/nuevo">Publicar mi espacio</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {spaces.map((w) => {
            const total = Number(w.total_m2);
            const usados = arrendados.get(w.id) ?? 0;
            const libres = Math.max(0, total - usados);
            const pct = total > 0 ? Math.round((usados / total) * 100) : 0;
            const guardados = skus.get(w.id)?.size ?? 0;
            const imagen = foto.get(w.id);

            return (
              <li key={w.id}>
                <Link
                  href={`/bodeguero/espacios/${w.id}`}
                  className="block rounded-[18px] border border-line-100 bg-white p-4 shadow-[0_2px_6px_rgba(16,36,58,.04)] transition-colors hover:border-navy-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-rayado">
                      {imagen ? (
                        <Image src={imagen} alt="" fill sizes="48px" className="object-cover" />
                      ) : null}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-extrabold text-navy-900">
                        {w.comuna} · {formatNumber(total, 0)} m²
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-500">
                        {guardados === 0
                          ? 'Sin mercadería guardada'
                          : `${guardados} ${guardados === 1 ? 'SKU almacenado' : 'SKUs almacenados'}`}
                      </p>
                    </div>

                    <Badge tone={TONE[w.status] ?? 'neutral'}>
                      {LABELS.warehouseStatus[w.status]}
                    </Badge>
                    <span aria-hidden className="shrink-0 text-line-300">
                      <Icon name="siguiente" size={14} />
                    </span>
                  </div>

                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="text-[14px] font-extrabold text-navy-800 tabular-nums">
                      {formatNumber(usados, 1)} / {formatNumber(total, 0)} m² usados
                    </span>
                    <span className="text-[11px] font-bold text-ink-500">· {pct}%</span>
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <div
                      role="progressbar"
                      aria-valuenow={Math.min(100, pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Ocupación del espacio"
                      className="h-[7px] flex-1 overflow-hidden rounded-pill bg-line-100"
                    >
                      <div
                        className={`h-full rounded-pill ${pct >= 100 ? 'bg-danger-600' : pct >= 85 ? 'bg-warning-600' : 'bg-success-600'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span
                      className={`shrink-0 text-[12px] font-bold ${libres > 0 ? 'text-success-700' : 'text-ink-500'}`}
                    >
                      {libres > 0 ? `quedan ${formatNumber(libres, 1)} m²` : 'completo'}
                    </span>
                  </div>

                  <p className="mt-3 border-t border-line-100 pt-3 text-[12px] text-ink-500">
                    {formatCLP(w.price_per_m2)} por m² al mes · {w.code}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="rounded-[16px] border-[1.5px] border-line-100 bg-surface-25 p-4 text-center">
        <span className="block text-[13px] font-bold text-ink-500">
          Puedes publicar más de un espacio
        </span>
        <span className="mt-1 block text-[12px] text-ink-500">
          Cada uno pasa por su propia visita de habilitación antes de aparecer en el buscador.
        </span>
      </p>

      <p className="text-center text-[12px] text-ink-500">
        Al publicar quedas cubierto por el seguro de la red, que responde por robo e incendio hasta
        2 millones por PyME.
      </p>
    </div>
  );
}
