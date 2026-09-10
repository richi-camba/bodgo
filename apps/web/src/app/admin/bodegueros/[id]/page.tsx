import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, type Tone } from '@/components/ui/badge';
import { StepHeader } from '@/components/app/step-header';
import { DataRow, RowCard, SectionLabel } from '@/components/app/rows';
import { createClient } from '@/lib/supabase/server';
import { calculateHostPayout, formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Bodeguero' };

const ESTADO: Record<string, Tone> = {
  draft: 'neutral',
  pending_review: 'warning',
  active: 'success',
  paused: 'neutral',
  rejected: 'danger',
};

export default async function AdminHostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: host }, { data: perfil }] = await Promise.all([
    supabase.from('bodeguero_profiles').select('*').eq('profile_id', id).maybeSingle(),
    supabase.from('public_profiles').select('full_name, verified, created_at').eq('id', id).maybeSingle(),
  ]);

  if (!host) notFound();

  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('id, code, comuna, address, total_m2, price_per_m2, status')
    .eq('bodeguero_id', id)
    .order('created_at');

  const ids = (warehouses ?? []).map((w) => w.id);

  const [{ data: contracts }, { data: shipments }, { data: payouts }] = await Promise.all([
    ids.length
      ? supabase.from('contracts').select('warehouse_id, m2, base_amount, status').in('warehouse_id', ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase.from('shipments').select('id, status').in('warehouse_id', ids)
      : Promise.resolve({ data: [] }),
    supabase
      .from('payouts')
      .select('id, period_start, gross_amount, net_amount, status')
      .eq('bodeguero_id', id)
      .order('period_start', { ascending: false })
      .limit(4),
  ]);

  const vigentes = (contracts ?? []).filter((c) => c.status === 'active');
  const totalM2 = (warehouses ?? []).reduce((s, w) => s + Number(w.total_m2), 0);
  const arrendados = vigentes.reduce((s, c) => s + Number(c.m2), 0);
  const ocupacion = totalM2 > 0 ? Math.round((arrendados / totalM2) * 100) : 0;
  const payout = calculateHostPayout(vigentes.reduce((s, c) => s + c.base_amount, 0));
  const conDiferencia = (shipments ?? []).filter((s) => s.status === 'discrepancy').length;

  return (
    <div className="space-y-4">
      <StepHeader
        titulo={perfil?.full_name ?? 'Bodeguero'}
        subtitulo={`★ ${Number(host.rating).toFixed(1)} · ${warehouses?.length ?? 0} ${
          warehouses?.length === 1 ? 'espacio' : 'espacios'
        }`}
        volverA="/admin/bodegueros"
        tomaLaPantalla={false}
        accion={
          <Badge tone={perfil?.verified ? 'success' : 'warning'}>
            {perfil?.verified ? 'Verificado' : 'Sin verificar'}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Caja rotulo="m² publicados" valor={formatNumber(totalM2, 1)} />
        <Caja rotulo="Ocupación" valor={`${ocupacion}%`} />
        <Caja rotulo="Contratos vigentes" valor={formatNumber(vigentes.length)} />
        <Caja rotulo="Neto del mes" valor={formatCLP(payout.net)} />
      </div>

      {conDiferencia > 0 ? (
        <p className="rounded-[12px] bg-warning-50 p-3.5 text-[12.5px] font-semibold text-warning-700">
          {conDiferencia === 1
            ? 'Registró una recepción con diferencia.'
            : `Registró ${conDiferencia} recepciones con diferencia.`}
        </p>
      ) : null}

      <SectionLabel>Espacios</SectionLabel>
      {warehouses?.length ? (
        <ul className="space-y-2.5">
          {warehouses.map((w) => {
            const usados = vigentes
              .filter((c) => c.warehouse_id === w.id)
              .reduce((s, c) => s + Number(c.m2), 0);
            return (
              <li
                key={w.id}
                className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line-100 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-navy-900">
                    {w.comuna} · {formatNumber(Number(w.total_m2), 0)} m²
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-500">
                    <span className="font-mono">{w.code}</span> · {w.address}
                  </p>
                </div>
                <span className="text-[13px] text-ink-700 tabular-nums">
                  {formatNumber(usados, 1)} m² arrendados
                </span>
                <Badge tone={ESTADO[w.status] ?? 'neutral'}>
                  {LABELS.warehouseStatus[w.status]}
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-[14px] border border-line-100 bg-white p-4 text-[13px] text-ink-500">
          Todavía no publicó ningún espacio.
        </p>
      )}

      <SectionLabel>Liquidaciones</SectionLabel>
      {payouts?.length ? (
        <RowCard>
          {payouts.map((p) => (
            <DataRow
              key={p.id}
              label={new Date(p.period_start).toLocaleDateString('es-CL', {
                month: 'long',
                year: 'numeric',
              })}
              value={
                <>
                  {formatCLP(p.net_amount)}{' '}
                  <span className="ml-1 text-[11.5px] font-semibold text-ink-500">
                    {p.status === 'released' ? 'liberado' : 'programado'}
                  </span>
                </>
              }
            />
          ))}
        </RowCard>
      ) : (
        <p className="rounded-[14px] border border-line-100 bg-white p-4 text-[13px] text-ink-500">
          Sin liquidaciones todavía.
        </p>
      )}

      <SectionLabel>Contacto y depósito</SectionLabel>
      <RowCard>
        <DataRow label="Teléfono" value={host.phone ?? '—'} />
        <DataRow label="RUT" value={host.rut ?? '—'} />
        <DataRow
          label="Banco"
          value={
            host.bank_name
              ? `${host.bank_name} ····${host.bank_account_last4 ?? ''}`
              : 'Sin cuenta cargada'
          }
        />
        <DataRow
          label="En la red desde"
          value={perfil?.created_at ? new Date(perfil.created_at).toLocaleDateString('es-CL') : '—'}
        />
      </RowCard>
    </div>
  );
}

function Caja({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-[14px] border border-line-100 bg-white p-3.5">
      <p className="text-[11px] font-semibold text-ink-500">{rotulo}</p>
      <p className="mt-1 text-[20px] font-extrabold text-navy-800 tabular-nums">{valor}</p>
    </div>
  );
}
