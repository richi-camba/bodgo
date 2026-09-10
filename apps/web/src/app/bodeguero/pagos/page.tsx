import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { calculateHostPayout, formatCLP, HOST_COMMISSION_RATE } from '@bodgo/core';

export const metadata: Metadata = { title: 'Pagos' };

export default async function PayoutsPage() {
  const user = await requireUser('bodeguero');
  const supabase = await createClient();

  const [{ data: payouts }, { data: contracts }, { data: profile }] = await Promise.all([
    supabase.from('payouts').select('*').order('period_start', { ascending: false }),
    supabase.from('contracts').select('id, base_amount, m2, status, warehouses(comuna)').eq('status', 'active'),
    supabase.from('bodeguero_profiles').select('bank_name, bank_account_last4').eq('profile_id', user.id).single(),
  ]);

  // Lo que se está devengando este mes con los contratos vigentes.
  const accruing = (contracts ?? []).reduce((s, c) => s + c.base_amount, 0);
  const projected = calculateHostPayout(accruing);
  const released = (payouts ?? [])
    .filter((p) => p.status === 'released')
    .reduce((s, p) => s + p.net_amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pagos"
        subtitle={`BodGo retiene el ${Math.round(HOST_COMMISSION_RATE * 100)}% y deposita el resto a fin de mes.`}
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat value={formatCLP(projected.gross)} label="Devengado este mes" />
        <Stat value={formatCLP(projected.net)} label="Neto proyectado" tone="success" />
        <Stat value={formatCLP(released)} label="Liberado histórico" />
      </div>

      <section className="card p-5">
        <h2 className="text-[15px] font-extrabold text-navy-900">Próximo pago</h2>
        <dl className="mt-4 space-y-2.5 text-[13.5px]">
          <Row label="Arriendo devengado" value={formatCLP(projected.gross)} />
          <Row
            label={`Comisión BodGo (${Math.round(HOST_COMMISSION_RATE * 100)}%)`}
            value={`−${formatCLP(projected.commission)}`}
          />
          <div className="flex items-center justify-between border-t border-line-200 pt-2.5">
            <dt className="font-extrabold text-navy-900">Neto a recibir</dt>
            <dd className="text-[19px] font-extrabold text-success-700 tabular-nums">
              {formatCLP(projected.net)}
            </dd>
          </div>
        </dl>

        {profile?.bank_name ? (
          <p className="mt-4 rounded-field bg-surface-50 p-3.5 text-[12.5px] text-ink-500">
            Se deposita en {profile.bank_name} ····{profile.bank_account_last4}.
          </p>
        ) : (
          <p className="mt-4 rounded-field bg-warning-50 p-3.5 text-[12.5px] font-semibold text-warning-700">
            Falta tu cuenta bancaria. Sin ella no podemos depositarte a fin de mes.
          </p>
        )}

        <p className="mt-4 text-[12.5px] leading-relaxed text-ink-500">
          El dinero de cada contrato queda en custodia desde que la PyME paga. Se libera a tu favor
          cuando confirmas la recepción de su mercadería sin diferencias.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-extrabold text-navy-900">Liquidaciones</h2>

        {!payouts?.length ? (
          <EmptyState
            icon="pagos"
            title="Todavía no hay liquidaciones"
            body="La primera se genera al cierre del mes en que recibas mercadería en tus espacios."
          />
        ) : (
          <ul className="space-y-2.5">
            {payouts.map((p) => (
              <li key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-extrabold text-navy-900">
                      {new Date(p.period_start).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                    </h3>
                    <Badge tone={p.status === 'released' ? 'success' : 'warning'}>
                      {p.status === 'released' ? 'Liberado' : 'Programado'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    Bruto {formatCLP(p.gross_amount)} · comisión {formatCLP(p.commission_amount)}
                  </p>
                </div>

                <span className="text-[16px] font-extrabold text-navy-900 tabular-nums">
                  {formatCLP(p.net_amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-bold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
