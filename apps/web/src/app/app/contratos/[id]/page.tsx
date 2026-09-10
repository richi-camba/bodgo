import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';
import { ContractSuccess } from '@/components/app/contract-success';
import { TerminateForm } from './terminate-form';

export const metadata: Metadata = { title: 'Contrato' };

export default async function ContractDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select(
      'id, contract_no, m2, capacity_m3, price_per_m2, base_amount, commission_amount, total_amount, status, start_date, next_charge_date, refund_amount, termination_days_used, warehouse_id, warehouses(comuna, sector_label, address, bodeguero_id)',
    )
    .eq('id', id)
    .maybeSingle();

  if (!contract) notFound();

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, status, created_at, failure_reason, refund_amount')
    .eq('contract_id', id)
    .order('created_at', { ascending: false });

  const { data: host } = await supabase
    .from('public_profiles')
    .select('full_name')
    .eq('id', contract.warehouses?.bodeguero_id ?? '')
    .maybeSingle();

  const failed = payments?.[0]?.status === 'failed';
  const isActive = contract.status === 'active';

  // Recién contratada: en vez del detalle de siempre se muestra la
  // confirmación, con los datos que hacen falta para despachar.
  if (nuevo === '1' && isActive) {
    const { data: contacto } = await supabase
      .from('bodeguero_profiles')
      .select('phone')
      .eq('profile_id', contract.warehouses?.bodeguero_id ?? '')
      .maybeSingle();

    return (
      <ContractSuccess
        contractNo={contract.contract_no}
        comuna={contract.warehouses?.comuna ?? ''}
        m2={Number(contract.m2)}
        total={contract.total_amount}
        bodeguero={host?.full_name ?? 'tu bodeguero'}
        telefono={contacto?.phone ?? null}
        direccion={contract.warehouses?.address ?? null}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/app/contratos" className="inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a mis contratos
      </Link>

      {failed ? (
        <div className="rounded-card border border-danger-600/25 bg-danger-50 p-5">
          <h2 className="text-[15px] font-extrabold text-danger-700">Pago rechazado</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">
            {payments?.[0]?.failure_reason ?? 'Tu medio de pago fue rechazado'}. No se realizó ningún
            cargo y el espacio no quedó reservado.
          </p>
          <ButtonLink href={`/app/buscar/${contract.warehouse_id}`} size="sm" className="mt-4">
            Intentar con otro medio de pago
          </ButtonLink>
        </div>
      ) : null}

      {contract.status === 'ended' && contract.refund_amount != null ? (
        <div className="rounded-card border border-success-600/25 bg-success-50 p-5">
          <h2 className="text-[15px] font-extrabold text-success-700">Contrato finalizado</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">
            Cancelamos el cobro recurrente. Te devolvemos{' '}
            <strong className="font-extrabold">{formatCLP(contract.refund_amount)}</strong> por los{' '}
            {30 - (contract.termination_days_used ?? 0)} días no usados. La devolución se libera desde
            la custodia en 3 a 5 días hábiles.
          </p>
        </div>
      ) : null}

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">
              {contract.warehouses?.comuna}
            </h1>
            <p className="mt-1 text-[13px] text-ink-500">
              {formatNumber(Number(contract.m2), 1)} m² · {host?.full_name}
            </p>
          </div>
          <Badge tone={isActive ? 'success' : 'neutral'}>{LABELS.contractStatus[contract.status]}</Badge>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Contrato" value={contract.contract_no} />
          <Metric label="Capacidad" value={`${formatNumber(Number(contract.capacity_m3 ?? 0), 1)} m³`} />
          <Metric label="Total mensual" value={formatCLP(contract.total_amount)} />
          <Metric label="Próximo cobro" value={contract.next_charge_date ?? '—'} />
        </dl>

        {isActive && contract.warehouses?.address ? (
          <div className="mt-5 rounded-field bg-brand-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
              Dirección de recepción
            </p>
            <p className="mt-1 text-[14px] font-bold text-navy-900">{contract.warehouses.address}</p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Lun a Vie 9:00–19:00 · Sáb 10:00–14:00. Etiqueta cada bulto con tu nombre de negocio y
              el N° de contrato.
            </p>
          </div>
        ) : null}
      </header>

      <section className="card">
        <h2 className="px-5 pt-5 text-[15px] font-extrabold text-navy-900">Historial de pagos</h2>
        {payments?.length ? (
          <ul className="mt-3 divide-y divide-line-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="text-[13.5px] font-bold text-navy-900">
                    {LABELS.paymentStatus[p.status]}
                  </p>
                  <p className="text-[12px] text-ink-400">
                    {new Date(p.created_at).toLocaleDateString('es-CL')}
                    {p.failure_reason ? ` · ${p.failure_reason}` : ''}
                  </p>
                </div>
                <span className="text-[14px] font-extrabold text-navy-900 tabular-nums">
                  {formatCLP(p.refund_amount ?? p.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-[13.5px] text-ink-400">Sin movimientos.</p>
        )}
      </section>

      {isActive ? <TerminateForm contractId={contract.id} baseAmount={contract.base_amount} /> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-surface-50 p-3">
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 truncate text-[14px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
