import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Mis contratos' };

const TONE = {
  active: 'success',
  pending_payment: 'warning',
  ended: 'neutral',
  cancelled: 'neutral',
} as const;

export default async function ContractsPage() {
  const supabase = await createClient();

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, contract_no, m2, capacity_m3, total_amount, status, next_charge_date, warehouses(comuna, sector_label)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title="Mis contratos"
        subtitle="Espacios que tienes arrendados en la red."
        action={<ButtonLink href="/app/buscar" size="sm">Contratar otra bodega</ButtonLink>}
      />

      {!contracts?.length ? (
        <EmptyState
          icon="contratos"
          title="Todavía no arriendas ningún espacio"
          body="Busca una microbodega cerca de tu demanda y contrata sólo los metros que necesitas."
          action={<ButtonLink href="/app/buscar">Buscar microbodega</ButtonLink>}
        />
      ) : (
        <ul className="space-y-3">
          {contracts.map((c) => (
            <li key={c.id}>
              <Link href={`/app/contratos/${c.id}`} className="card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[15.5px] font-extrabold text-navy-900">
                      {c.warehouses?.comuna}
                    </h2>
                    <Badge tone={TONE[c.status]}>{LABELS.contractStatus[c.status]}</Badge>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-400">
                    {c.contract_no} · {formatNumber(Number(c.m2), 1)} m² ·{' '}
                    {formatNumber(Number(c.capacity_m3 ?? 0), 1)} m³ apilables
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[15px] font-extrabold text-navy-900 tabular-nums">
                    {formatCLP(c.total_amount)}
                    <span className="text-[11px] font-bold text-ink-400"> /mes</span>
                  </p>
                  {c.next_charge_date ? (
                    <p className="text-[11.5px] text-ink-400">Próximo cobro {c.next_charge_date}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
