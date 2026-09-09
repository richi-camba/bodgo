import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/stat';
import { Avatar } from '@/components/app/shell';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { CLAIM_WINDOW_HOURS, INSURANCE_COVERAGE_CLP, formatCompactCLP } from '@bodgo/core';

export const metadata: Metadata = { title: 'Mi perfil' };

const CHANNEL_LABEL: Record<string, string> = {
  mercadolibre: 'Mercado Libre',
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  manual: 'Manual',
};

export default async function ProfilePage() {
  const user = await requireUser('pyme');
  const supabase = await createClient();

  const [{ data: pyme }, { data: cards }] = await Promise.all([
    supabase.from('pyme_profiles').select('*').eq('profile_id', user.id).single(),
    supabase.from('payment_methods').select('*').order('is_default', { ascending: false }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Mi perfil" />

      <header className="card flex items-center gap-4 p-6">
        <Avatar initials={user.initials} size={52} />
        <div>
          <h1 className="text-[19px] font-extrabold tracking-tight text-navy-900">{user.fullName}</h1>
          <p className="text-[13.5px] text-ink-500">{pyme?.business_name}</p>
          {user.verified ? (
            <Badge tone="success" className="mt-2">
              Cuenta verificada
            </Badge>
          ) : (
            <Badge tone="warning" className="mt-2">
              Verificación pendiente
            </Badge>
          )}
        </div>
      </header>

      <section className="card p-5">
        <h2 className="text-eyebrow">Datos de la cuenta</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Row label="Correo" value={pyme?.email ?? user.email ?? '—'} />
          <Row label="Teléfono" value={pyme?.phone ?? '—'} />
          <Row label="Razón social" value={pyme?.legal_name ?? '—'} />
          <Row label="RUT empresa" value={pyme?.rut ?? '—'} />
          <Row label="Giro" value={pyme?.giro ?? '—'} />
          <Row
            label="Canales de venta"
            value={
              pyme?.sales_channels?.length
                ? pyme.sales_channels.map((c) => CHANNEL_LABEL[c] ?? c).join(' · ')
                : '—'
            }
          />
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-eyebrow">Medios de pago</h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
          El arriendo se cobra por adelantado y queda en custodia hasta que el bodeguero confirma la
          recepción de tu mercadería.
        </p>

        {cards?.length ? (
          <ul className="mt-4 space-y-2">
            {cards.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-field border border-line-200 p-3.5">
                <span className="text-[12px] font-extrabold uppercase tracking-wide text-ink-500">
                  {c.brand}
                </span>
                <span className="flex-1 text-[13.5px] font-bold text-navy-900">•••• {c.last4}</span>
                {c.exp_month && c.exp_year ? (
                  <span className="text-[11.5px] text-ink-400">
                    Vence {String(c.exp_month).padStart(2, '0')}/{String(c.exp_year).slice(-2)}
                  </span>
                ) : null}
                {c.is_default ? <Badge tone="brand">Principal</Badge> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[13px] text-ink-400">No tienes tarjetas guardadas.</p>
        )}

        <p className="mt-4 text-[12px] leading-relaxed text-ink-400">
          Los datos de tarjeta se procesan con el medio de pago; BodGo no almacena el número
          completo, sólo la marca y los últimos cuatro dígitos.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-eyebrow">Cobertura y reclamos</h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-700">
          Tu mercadería está cubierta por el seguro de la red hasta{' '}
          <strong className="font-extrabold">{formatCompactCLP(INSURANCE_COVERAGE_CLP)}</strong> por
          robo e incendio. Si algo llegó dañado o falta stock, abre un reclamo dentro de las{' '}
          {CLAIM_WINDOW_HOURS} horas siguientes a la recepción: el pago en custodia queda retenido
          mientras lo revisamos.
        </p>
        <a href="mailto:ayuda@bodgo.cl" className="mt-4 inline-block text-[13px] font-bold text-brand-600 hover:underline">
          Escribir a ayuda@bodgo.cl →
        </a>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-[13.5px] font-semibold text-navy-900">{value}</dd>
    </div>
  );
}
