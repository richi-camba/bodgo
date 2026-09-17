import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/stat';
import { Avatar } from '@/components/app/shell';
import { SignOutButton } from '@/components/app/sign-out-button';
import { DataRow, LinkRow, RowCard, SectionLabel } from '@/components/app/rows';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { calculateHostPayout, formatCLP, HOST_COMMISSION_RATE } from '@bodgo/core';

export const metadata: Metadata = { title: 'Mi perfil' };

/**
 * El perfil del bodeguero.
 *
 * Muestra lo suyo —contacto, datos de pago, sus espacios y lo que lleva
 * retenido— y no lo de la PyME. La cuenta bancaria aparece sólo por sus
 * últimos cuatro dígitos: el número completo no se guarda.
 */
export default async function HostProfilePage() {
  const user = await requireUser('bodeguero');
  const supabase = await createClient();

  const [{ data: perfil }, { data: espacios }, { data: custodia }] = await Promise.all([
    supabase.from('bodeguero_profiles').select('*').eq('profile_id', user.id).single(),
    supabase.from('warehouses').select('comuna, total_m2, status'),
    supabase.from('host_escrow').select('held_base_amount').maybeSingle(),
  ]);

  const publicados = (espacios ?? []).filter((e) => e.status === 'active');
  const totalM2 = publicados.reduce((s, e) => s + Number(e.total_m2 ?? 0), 0);
  // Lo que le va a llegar, no lo que la PyME pagó: la comisión ya descontada.
  const retenido = calculateHostPayout(Number(custodia?.held_base_amount ?? 0)).net;

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
          <p className="mt-0.5 truncate text-[13px] text-ink-500">
            {publicados.length
              ? `${publicados.length} ${publicados.length === 1 ? 'espacio activo' : 'espacios activos'} · ${totalM2} m²`
              : 'Sin espacios activos'}
          </p>
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
        <DataRow label="Correo" value={perfil?.email ?? user.email ?? '—'} />
        <DataRow label="Teléfono" value={perfil?.phone ?? '—'} />
        <DataRow label="RUT" value={perfil?.rut ?? '—'} />
        <DataRow
          label="Calificación"
          value={
            perfil?.ratings_count
              ? `${Number(perfil.rating).toFixed(1).replace('.', ',')} · ${perfil.ratings_count} ${perfil.ratings_count === 1 ? 'evaluación' : 'evaluaciones'}`
              : 'Todavía sin evaluaciones'
          }
        />
        <DataRow
          label="Comunas donde operas"
          value={perfil?.preferred_comunas?.length ? perfil.preferred_comunas.join(' · ') : '—'}
        />
      </RowCard>

      {/* --------------------------------------------------------- cobros */}
      <SectionLabel>Cómo te pagamos</SectionLabel>
      <div className="rounded-[16px] border border-line-100 bg-white p-4">
        <RowCard>
          <DataRow label="Banco" value={perfil?.bank_name ?? '—'} />
          <DataRow
            label="Cuenta"
            value={perfil?.bank_account_last4 ? `···· ${perfil.bank_account_last4}` : '—'}
          />
          <DataRow label="Comisión BodGo" value={`${Math.round(HOST_COMMISSION_RATE * 100)}%`} />
          <DataRow label="En custodia a tu favor" value={formatCLP(retenido)} />
        </RowCard>

        <p className="mt-3 border-t border-line-100 pt-3 text-[12px] leading-relaxed text-ink-500">
          Se liquida a fin de mes, neto de comisión, y sólo sobre las recepciones ya confirmadas.
          Guardamos los últimos cuatro dígitos de tu cuenta, nunca el número completo. Para
          cambiarla, escríbenos a{' '}
          <a href="mailto:ayuda@bodgo.cl" className="font-bold text-brand-600 hover:underline">
            ayuda@bodgo.cl
          </a>
          .
        </p>
      </div>

      {/* ---------------------------------------------------- preferencias */}
      <SectionLabel>Preferencias</SectionLabel>
      <RowCard>
        <LinkRow href="/bodeguero/espacios" icon="espacios">
          Mis espacios y horarios
        </LinkRow>
        <LinkRow href="/bodeguero/notificaciones" icon="notificaciones">
          Notificaciones
        </LinkRow>
        <LinkRow href="/bodeguero/tickets/nuevo" icon="ayuda">
          Ayuda y soporte
        </LinkRow>
      </RowCard>

      <div className="mt-5">
        <SignOutButton destacado />
      </div>
    </div>
  );
}
