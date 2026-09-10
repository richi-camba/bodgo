import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge, type Tone } from '@/components/ui/badge';
import { StepHeader } from '@/components/app/step-header';
import { DataRow, RowCard, SectionLabel } from '@/components/app/rows';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, formatNumber, LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'PyME' };

const CONTRATO: Record<string, Tone> = {
  pending_payment: 'warning',
  active: 'success',
  terminated: 'neutral',
  expired: 'neutral',
};

export default async function AdminPymeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pyme } = await supabase
    .from('pyme_profiles')
    .select('*')
    .eq('profile_id', id)
    .maybeSingle();

  if (!pyme) notFound();

  const [{ data: contracts }, { data: orders }, { data: products }, { data: shipments }] =
    await Promise.all([
      supabase
        .from('contracts')
        .select('id, m2, base_amount, total_amount, status, start_date, warehouse_id, warehouses(comuna, code, bodeguero_id)')
        .eq('pyme_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('orders').select('id, status, total_amount, created_at').eq('pyme_id', id),
      supabase.from('products').select('id').eq('pyme_id', id).eq('active', true),
      supabase.from('shipments').select('id, status').eq('pyme_id', id),
    ]);

  const hostIds = [
    ...new Set((contracts ?? []).map((c) => c.warehouses?.bodeguero_id).filter(Boolean)),
  ] as string[];
  const { data: hosts } = hostIds.length
    ? await supabase.from('public_profiles').select('id, full_name').in('id', hostIds)
    : { data: [] };
  const nombre = new Map((hosts ?? []).map((h) => [h.id, h.full_name ?? '—']));

  const vigentes = (contracts ?? []).filter((c) => c.status === 'active');
  const gmv = (orders ?? []).reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const conDiferencia = (shipments ?? []).filter((s) => s.status === 'discrepancy').length;

  return (
    <div className="space-y-4">
      <StepHeader
        titulo={pyme.business_name}
        subtitulo={[pyme.comuna, pyme.rut].filter(Boolean).join(' · ')}
        volverA="/admin/pymes"
        tomaLaPantalla={false}
        accion={
          <Badge tone={vigentes.length ? 'success' : 'neutral'}>
            {vigentes.length ? 'Activa' : 'Sin contratos'}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Caja rotulo="Bodegas contratadas" valor={formatNumber(vigentes.length)} />
        <Caja
          rotulo="m² vigentes"
          valor={formatNumber(vigentes.reduce((s, c) => s + Number(c.m2), 0), 1)}
        />
        <Caja rotulo="SKUs activos" valor={formatNumber(products?.length ?? 0)} />
        <Caja rotulo="GMV acumulado" valor={formatCLP(gmv)} />
      </div>

      {conDiferencia > 0 ? (
        <p className="rounded-[12px] bg-warning-50 p-3.5 text-[12.5px] font-semibold text-warning-700">
          {conDiferencia === 1
            ? 'Tiene un envío recibido con diferencia.'
            : `Tiene ${conDiferencia} envíos recibidos con diferencia.`}{' '}
          Revisa las discrepancias antes de liberar pagos.
        </p>
      ) : null}

      <SectionLabel>Bodegas contratadas</SectionLabel>
      {contracts?.length ? (
        <ul className="space-y-2.5">
          {contracts.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-[14px] border border-line-100 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-navy-900">
                  {c.warehouses?.comuna} · {formatNumber(Number(c.m2), 1)} m²
                </p>
                <p className="mt-0.5 text-[12px] text-ink-500">
                  {nombre.get(c.warehouses?.bodeguero_id ?? '') ?? '—'} ·{' '}
                  <span className="font-mono">{c.warehouses?.code}</span>
                  {c.start_date ? ` · desde ${new Date(c.start_date).toLocaleDateString('es-CL')}` : ''}
                </p>
              </div>
              <span className="text-[13.5px] font-extrabold text-navy-900 tabular-nums">
                {formatCLP(c.total_amount)}
                <span className="ml-1 text-[11px] font-bold text-ink-500">/mes</span>
              </span>
              <Badge tone={CONTRATO[c.status] ?? 'neutral'}>
                {LABELS.contractStatus[c.status]}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[14px] border border-line-100 bg-white p-4 text-[13px] text-ink-500">
          Todavía no contrató ningún espacio.
        </p>
      )}

      <SectionLabel>Contacto</SectionLabel>
      <RowCard>
        <DataRow
          label="Correo"
          value={
            pyme.email ? (
              <a href={`mailto:${pyme.email}`} className="text-brand-600 hover:underline">
                {pyme.email}
              </a>
            ) : (
              '—'
            )
          }
        />
        <DataRow label="Teléfono" value={pyme.phone ?? '—'} />
        <DataRow label="Razón social" value={pyme.legal_name ?? '—'} />
        <DataRow label="RUT" value={pyme.rut ?? '—'} />
        <DataRow label="Giro" value={pyme.giro ?? '—'} />
        <DataRow label="Dirección" value={pyme.address ?? '—'} />
      </RowCard>

      <p className="text-[12px] text-ink-500">
        <Link href="/admin/pedidos" className="font-bold text-brand-600 hover:underline">
          Ver los pedidos de la red
        </Link>{' '}
        · {orders?.length ?? 0} de esta PyME.
      </p>
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
