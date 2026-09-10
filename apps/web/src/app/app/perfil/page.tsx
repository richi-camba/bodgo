import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/stat';
import { Avatar } from '@/components/app/shell';
import { SignOutButton } from '@/components/app/sign-out-button';
import { DataRow, LinkRow, RowCard, SectionLabel } from '@/components/app/rows';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { CLAIM_WINDOW_HOURS, formatCompactCLP, INSURANCE_COVERAGE_CLP } from '@bodgo/core';

export const metadata: Metadata = { title: 'Mi perfil' };

const CANAL: Record<string, string> = {
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

  const principal = cards?.find((c) => c.is_default) ?? cards?.[0];

  return (
    <div className="pb-6">
      <PageHeader title="Mi perfil" />

      {/* ------------------------------------------------------- identidad */}
      <div className="flex items-center gap-4 rounded-[18px] border border-line-100 bg-white p-5 shadow-[0_2px_8px_rgba(16,36,58,.05)]">
        <Avatar initials={user.initials} size={60} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-extrabold tracking-tight text-navy-900">
            {user.fullName}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-500">{pyme?.business_name}</p>
          <p
            className={`mt-2 inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-bold ${
              user.verified ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
            }`}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${user.verified ? 'bg-success-600' : 'bg-warning-600'}`}
            />
            {user.verified ? 'Cuenta verificada' : 'Verificación pendiente'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------- datos */}
      <SectionLabel>Datos de la cuenta</SectionLabel>
      <RowCard>
        <DataRow label="Correo" value={pyme?.email ?? user.email ?? '—'} />
        <DataRow label="Teléfono" value={pyme?.phone ?? '—'} />
        <DataRow label="Razón social" value={pyme?.legal_name ?? '—'} />
        <DataRow label="RUT empresa" value={pyme?.rut ?? '—'} />
        <DataRow label="Giro" value={pyme?.giro ?? '—'} />
        <DataRow
          label="Canal de venta"
          value={
            pyme?.sales_channels?.length
              ? pyme.sales_channels.map((c) => CANAL[c] ?? c).join(' · ')
              : '—'
          }
        />
      </RowCard>

      {/* ------------------------------------------------------ medio pago */}
      <SectionLabel>Método de pago</SectionLabel>
      <div className="rounded-[16px] border border-line-100 bg-white p-4">
        {principal ? (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-[30px] w-11 shrink-0 rounded-[6px] bg-gradient-to-br from-brand-600 to-navy-800"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-navy-900">
                {principal.brand} ···· {principal.last4}
              </p>
              <p className="mt-px text-[11px] text-ink-500">
                {principal.exp_month && principal.exp_year
                  ? `Vence ${String(principal.exp_month).padStart(2, '0')}/${String(principal.exp_year).slice(-2)} · cobro por adelantado`
                  : 'Cobro por adelantado'}
              </p>
            </div>
            {cards && cards.length > 1 ? (
              <span className="shrink-0 text-[11.5px] text-ink-500">
                +{cards.length - 1} más
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-[13px] text-ink-500">No tienes tarjetas guardadas.</p>
        )}

        {/* El prototipo permite agregar tarjeta acá. La captura de datos de
            tarjeta la hace el proveedor de pagos, que todavía no está
            contratado: un formulario propio pidiendo el número sería pedir
            datos que no podemos procesar. */}
        <p className="mt-3 border-t border-line-100 pt-3 text-[12px] leading-relaxed text-ink-500">
          Agregar o cambiar la tarjeta se habilita cuando esté el convenio con el proveedor de
          pagos. BodGo nunca guarda el número completo, sólo la marca y los últimos cuatro dígitos.
        </p>
      </div>

      {/* ---------------------------------------------------- preferencias */}
      <SectionLabel>Preferencias</SectionLabel>
      <RowCard>
        <LinkRow href="/app/perfil/notificaciones" icon="notificaciones">
          Notificaciones
        </LinkRow>
        <LinkRow href="/app/perfil/seguridad" icon="clave">
          Seguridad y contraseña
        </LinkRow>
        <LinkRow href="/app/perfil/ayuda" icon="ayuda">
          Ayuda y soporte
        </LinkRow>
      </RowCard>

      {/* ------------------------------------------------------- cobertura */}
      <SectionLabel>Cobertura y reclamos</SectionLabel>
      <div className="rounded-[16px] border border-line-100 bg-white p-4">
        <p className="text-[12.5px] leading-relaxed text-ink-700">
          Tu mercadería está cubierta por el seguro de la red hasta{' '}
          <strong className="font-extrabold text-navy-900">
            {formatCompactCLP(INSURANCE_COVERAGE_CLP)}
          </strong>{' '}
          por robo e incendio. Si algo llegó dañado o falta stock, abre un reclamo dentro de las{' '}
          {CLAIM_WINDOW_HOURS} horas siguientes a la recepción: el pago en custodia queda retenido
          mientras lo revisamos.
        </p>
      </div>

      <div className="mt-5">
        <SignOutButton destacado />
      </div>
    </div>
  );
}
