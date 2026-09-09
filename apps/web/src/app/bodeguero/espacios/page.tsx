import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS, pricePerM3 } from '@bodgo/core';
import { WarehouseToggle } from './toggle';

export const metadata: Metadata = { title: 'Mis espacios' };

const TONE = {
  draft: 'neutral',
  pending_review: 'warning',
  active: 'success',
  paused: 'neutral',
  rejected: 'danger',
} as const;

export default async function SpacesPage() {
  const supabase = await createClient();

  const [{ data: spaces }, { data: contracts }, { data: checklist }] = await Promise.all([
    supabase.from('warehouses').select('*').order('created_at'),
    supabase.from('contracts').select('warehouse_id, m2').eq('status', 'active'),
    supabase.from('warehouse_checklist').select('warehouse_id, item, status'),
  ]);

  const takenByWarehouse = new Map<string, number>();
  for (const c of contracts ?? []) {
    takenByWarehouse.set(c.warehouse_id, (takenByWarehouse.get(c.warehouse_id) ?? 0) + Number(c.m2));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mis espacios"
        subtitle="Microbodegas que tienes publicadas en la red."
        action={<ButtonLink href="/bodeguero/espacios/nuevo" size="sm">Publicar espacio</ButtonLink>}
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
            const taken = takenByWarehouse.get(w.id) ?? 0;
            const free = Number(w.total_m2) - taken;
            const pct = Number(w.total_m2) > 0 ? Math.round((taken / Number(w.total_m2)) * 100) : 0;
            const pendingChecks = (checklist ?? []).filter(
              (c) => c.warehouse_id === w.id && c.status === 'pending',
            );

            return (
              <li key={w.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[16px] font-extrabold text-navy-900">{w.comuna}</h2>
                      <Badge tone={TONE[w.status]}>{LABELS.warehouseStatus[w.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-ink-400">
                      {w.code} · {w.address}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[15px] font-extrabold text-navy-900 tabular-nums">
                      {formatCLP(w.price_per_m2)}
                      <span className="text-[11px] font-bold text-ink-400"> /m² al mes</span>
                    </p>
                    <p className="text-[11.5px] text-ink-400">
                      ≈ {formatCLP(pricePerM3(w.price_per_m2))} por m³
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className="text-ink-500">
                      {formatNumber(taken, 1)} de {formatNumber(Number(w.total_m2), 1)} m² arrendados
                    </span>
                    <span className="font-bold text-navy-900">
                      quedan {formatNumber(free, 1)} m² · {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-pill bg-line-100">
                    <div className="h-full rounded-pill bg-navy-800" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>

                {w.status === 'pending_review' ? (
                  <div className="mt-4 rounded-field bg-warning-50 p-4">
                    <p className="text-[13px] font-bold text-warning-600">Enviado a revisión</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-700">
                      Un evaluador de BodGo agenda la visita de habilitación en los próximos 3 a 5
                      días hábiles. Mientras tanto: despeja el espacio, deja el extintor a la vista y
                      ten a mano el certificado de dominio o el contrato de arriendo.
                    </p>
                    {pendingChecks.length > 0 ? (
                      <ul className="mt-3 space-y-1">
                        {pendingChecks.map((c) => (
                          <li key={c.item} className="text-[12px] text-ink-500">
                            ○ {c.item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                {w.status === 'active' || w.status === 'paused' ? (
                  <div className="mt-4 border-t border-line-100 pt-4">
                    <WarehouseToggle warehouseId={w.id} status={w.status} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[12.5px] text-ink-400">
        Al publicar quedas cubierto por el seguro de la red, que responde por robo e incendio hasta 2
        millones por PyME.
      </p>
    </div>
  );
}
