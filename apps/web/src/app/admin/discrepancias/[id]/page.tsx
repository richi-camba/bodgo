import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, LABELS } from '@bodgo/core';
import { ResolveForm } from './resolve-form';

export const metadata: Metadata = { title: 'Discrepancia' };

export default async function DiscrepancyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: d } = await supabase
    .from('discrepancies')
    .select('*, shipments(id, code, pyme_id, received_at, warehouses(comuna, bodeguero_id))')
    .eq('id', id)
    .maybeSingle();

  if (!d) notFound();

  const [{ data: items }, { data: pyme }, { data: host }, { data: notes }] = await Promise.all([
    supabase.from('shipment_items').select('*').eq('shipment_id', d.shipment_id).order('name'),
    supabase.from('pyme_profiles').select('business_name, email, phone').eq('profile_id', d.shipments?.pyme_id ?? '').maybeSingle(),
    supabase.from('public_profiles').select('full_name').eq('id', d.shipments?.warehouses?.bodeguero_id ?? '').maybeSingle(),
    supabase.from('discrepancy_notes').select('*').eq('discrepancy_id', id).order('created_at'),
  ]);

  const closed = d.status === 'accepted' || d.status === 'resolved';

  return (
    <div className="space-y-5">
      <Link href="/admin/discrepancias" className="inline-block text-[13px] font-bold text-brand-600 hover:underline">
        ← Volver a discrepancias
      </Link>

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900">
              {d.code} · {pyme?.business_name}
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-500">
              Envío {d.shipments?.code} · {d.shipments?.warehouses?.comuna} · recibido el{' '}
              {d.shipments?.received_at
                ? new Date(d.shipments.received_at).toLocaleDateString('es-CL')
                : '—'}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge tone="neutral">{LABELS.discrepancyType[d.type]}</Badge>
            <Badge tone={closed ? 'success' : 'danger'}>{LABELS.discrepancyStatus[d.status]}</Badge>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------- volumen */}
      {d.type !== 'units' ? (
        <section className="card p-5">
          <h2 className="text-eyebrow">Medición de volumen</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Declarado" value={`${formatNumber(Number(d.declared_m3 ?? 0), 2)} m³`} />
            <Metric label="Recibido" value={`${formatNumber(Number(d.received_m3 ?? 0), 2)} m³`} />
            <Metric label="Capacidad" value={`${formatNumber(Number(d.capacity_m3 ?? 0), 1)} m³`} />
            <Metric label="Exceso" value={`${formatNumber(Number(d.excess_m3 ?? 0), 2)} m³`} />
          </dl>
          {Number(d.excess_m3 ?? 0) > 0 ? (
            <p className="mt-4 rounded-field bg-danger-50 p-3.5 text-[12.5px] leading-relaxed text-danger-700">
              Excede en {formatNumber(Number(d.excess_m3), 2)} m³ la capacidad contratada.
              Corresponde ampliar el contrato o retirar el excedente.
            </p>
          ) : null}
        </section>
      ) : null}

      {/* -------------------------------------------------- conteo por línea */}
      <section className="card">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-eyebrow">Conteo línea a línea</h2>
          <span className="text-[12.5px] text-ink-500">
            {d.received_units} recibidas de {d.declared_units} declaradas
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="border-y border-line-100 bg-surface-25 text-left text-[11px] uppercase tracking-wide text-ink-400">
                <th className="px-5 py-2.5 font-bold">Producto</th>
                <th className="px-3 py-2.5 text-right font-bold">Declarado</th>
                <th className="px-3 py-2.5 text-right font-bold">Recibido</th>
                <th className="px-3 py-2.5 text-right font-bold">Δ</th>
                <th className="px-5 py-2.5 text-right font-bold">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100">
              {(items ?? []).map((item) => {
                const received = item.received_qty ?? item.declared_qty;
                const delta = received - item.declared_qty;
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-3">
                      <p className="font-bold text-navy-900">{item.name}</p>
                      <p className="text-[11.5px] text-ink-400">{item.sku}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{item.declared_qty} u</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{received} u</td>
                    <td
                      className={`px-3 py-3 text-right font-bold tabular-nums ${
                        delta < 0 ? 'text-danger-700' : delta > 0 ? 'text-warning-700' : 'text-ink-400'
                      }`}
                    >
                      {delta > 0 ? '+' : ''}
                      {delta}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {delta === 0 ? (
                        <Badge tone="success">Coincide</Badge>
                      ) : (
                        <Badge tone="danger">Difiere</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* --------------------------------------------------- nota y contacto */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-eyebrow">Nota del bodeguero</h2>
          {d.host_note ? (
            <blockquote className="mt-3 border-l-2 border-line-200 pl-3 text-[13.5px] italic leading-relaxed text-ink-700">
              “{d.host_note}”
            </blockquote>
          ) : (
            <p className="mt-3 text-[13px] text-ink-400">Sin nota.</p>
          )}
          <p className="mt-3 text-[12px] text-ink-400">{host?.full_name}</p>
        </section>

        <section className="card p-5">
          <h2 className="text-eyebrow">Contacto de la PyME</h2>
          <dl className="mt-3 space-y-2 text-[13.5px]">
            <div className="flex justify-between">
              <dt className="text-ink-500">Negocio</dt>
              <dd className="font-bold text-navy-900">{pyme?.business_name}</dd>
            </div>
            {pyme?.email ? (
              <div className="flex justify-between">
                <dt className="text-ink-500">Correo</dt>
                <dd className="font-semibold text-navy-900">{pyme.email}</dd>
              </div>
            ) : null}
            {pyme?.phone ? (
              <div className="flex justify-between">
                <dt className="text-ink-500">Teléfono</dt>
                <dd className="font-semibold text-navy-900">{pyme.phone}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>

      {notes?.length ? (
        <section className="card p-5">
          <h2 className="text-eyebrow">Notas internas</h2>
          <ul className="mt-3 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-field bg-surface-50 p-3">
                <p className="text-[13px] text-ink-700">{n.body}</p>
                <p className="mt-1 text-[11.5px] text-ink-400">
                  {new Date(n.created_at).toLocaleString('es-CL')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ResolveForm discrepancyId={d.id} closed={closed} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-field bg-surface-50 p-3">
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-[15px] font-extrabold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
