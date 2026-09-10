import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { calculateHostPayout, formatCLP, HOST_COMMISSION_RATE } from '@bodgo/core';

export const metadata: Metadata = { title: 'Pagos' };

/** Días que faltan para el cierre de mes, que es cuando se libera. */
function diasHastaElCierre(hoy: Date) {
  const cierre = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  return Math.max(0, Math.ceil((cierre.getTime() - hoy.getTime()) / 86_400_000));
}

export default async function PayoutsPage() {
  const user = await requireUser('bodeguero');
  const supabase = await createClient();

  const [{ data: payouts }, { data: contracts }, { data: profile }, { data: escrow }] =
    await Promise.all([
      supabase.from('payouts').select('*').order('period_start', { ascending: false }),
      supabase
        .from('contracts')
        .select('id, base_amount, m2, status, warehouses(comuna)')
        .eq('status', 'active'),
      supabase
        .from('bodeguero_profiles')
        .select('bank_name, bank_account_last4')
        .eq('profile_id', user.id)
        .single(),
      // La custodia sale de una vista: `payments` está cerrado al bodeguero
      // por RLS y sólo se le devuelve el agregado que le corresponde.
      supabase.from('host_escrow').select('held_base_amount, held_payments').maybeSingle(),
    ]);

  const devengado = (contracts ?? []).reduce((s, c) => s + c.base_amount, 0);
  const proyectado = calculateHostPayout(devengado);
  const enCustodia = calculateHostPayout(Number(escrow?.held_base_amount ?? 0));
  const dias = diasHastaElCierre(new Date());

  const delMes = (payouts ?? []).filter((p) => p.status === 'released');
  const ingresosDelMes = delMes[0]?.net_amount ?? proyectado.net;

  return (
    <div className="space-y-4">
      <PageHeader title="Pagos" subtitle="Ingresos y liberaciones" />

      <section className="rounded-[18px] bg-gradient-to-br from-navy-800 to-navy-950 p-[18px] text-white">
        <p className="text-[12px] font-semibold text-white/60">
          {delMes.length ? 'Última liquidación' : 'Neto proyectado del mes'}
        </p>
        <p className="mt-1 text-[30px] font-extrabold leading-none tracking-tight tabular-nums">
          {formatCLP(ingresosDelMes)}
        </p>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-white/60">
          Por {contracts?.length ?? 0} {contracts?.length === 1 ? 'contrato vigente' : 'contratos vigentes'}, ya
          descontada la comisión BodGo.
        </p>
      </section>

      <div className="flex gap-2.5">
        <Caja
          rotulo="En custodia"
          valor={formatCLP(enCustodia.net)}
          color="text-warning-700"
          nota={
            escrow?.held_payments
              ? `${escrow.held_payments} ${escrow.held_payments === 1 ? 'pago retenido' : 'pagos retenidos'}`
              : 'Nada retenido'
          }
        />
        <Caja
          rotulo="Próxima liberación"
          valor={dias === 0 ? 'Hoy' : `${dias} ${dias === 1 ? 'día' : 'días'}`}
          nota="Al cierre del mes"
        />
      </div>

      <section className="card p-4">
        {/* El titular ya dice cuánto: acá va de dónde sale, que es lo que
            hace creíble la cifra. */}
        <h2 className="text-[14px] font-extrabold text-navy-900">Cómo se calcula</h2>
        <dl className="mt-3.5 space-y-2.5 text-[13.5px]">
          <Row label="Arriendo devengado" value={formatCLP(proyectado.gross)} />
          <Row
            label={`Comisión BodGo (${Math.round(HOST_COMMISSION_RATE * 100)}%)`}
            value={`−${formatCLP(proyectado.commission)}`}
          />
          <div className="flex items-center justify-between border-t border-line-200 pt-2.5">
            <dt className="font-extrabold text-navy-900">Neto a recibir</dt>
            <dd className="font-extrabold text-success-700 tabular-nums">
              {formatCLP(proyectado.net)}
            </dd>
          </div>
        </dl>

        {profile?.bank_name ? (
          <p className="mt-3.5 rounded-[12px] bg-surface-25 p-3 text-[12px] text-ink-500">
            Se deposita en {profile.bank_name} ····{profile.bank_account_last4}.
          </p>
        ) : (
          <p className="mt-3.5 flex items-center gap-2.5 rounded-[12px] bg-warning-50 p-3 text-[12px] font-semibold text-warning-700">
            <span className="shrink-0">
              <Icon name="discrepancias" size={15} />
            </span>
            Falta tu cuenta bancaria. Sin ella no podemos depositarte a fin de mes.
          </p>
        )}

        <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
          El dinero de cada contrato queda en custodia desde que la PyME paga. Se libera a tu favor
          cuando confirmas la recepción de su mercadería sin diferencias.
        </p>
      </section>

      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-navy-900">Liberaciones recientes</h2>

        {!payouts?.length ? (
          <EmptyState
            icon="pagos"
            title="Todavía no hay liquidaciones"
            body="La primera se genera al cierre del mes en que recibas mercadería en tus espacios."
          />
        ) : (
          <ul className="space-y-2.5">
            {payouts.map((p) => {
              const liberado = p.status === 'released';
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-[14px] border border-line-100 bg-white p-3.5"
                >
                  <span
                    aria-hidden
                    className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] ${
                      liberado ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                    }`}
                  >
                    <Icon name={liberado ? 'listo' : 'reloj'} size={15} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold capitalize text-navy-900">
                      {new Date(p.period_start).toLocaleDateString('es-CL', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-px text-[11px] text-ink-500">
                      Bruto {formatCLP(p.gross_amount)} · comisión {formatCLP(p.commission_amount)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-[14px] font-extrabold tabular-nums ${liberado ? 'text-success-700' : 'text-navy-900'}`}
                    >
                      {formatCLP(p.net_amount)}
                    </p>
                    <Badge tone={liberado ? 'success' : 'warning'}>
                      {liberado ? 'Liberado' : 'Programado'}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Caja({
  rotulo,
  valor,
  nota,
  color = 'text-navy-800',
}: {
  rotulo: string;
  valor: string;
  nota: string;
  color?: string;
}) {
  return (
    <div className="flex-1 rounded-[14px] border border-line-100 bg-white p-3.5">
      <p className="text-[11px] font-semibold text-ink-500">{rotulo}</p>
      <p className={`mt-1 text-[18px] font-extrabold tabular-nums ${color}`}>{valor}</p>
      <p className="mt-1 text-[11px] text-ink-500">{nota}</p>
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
