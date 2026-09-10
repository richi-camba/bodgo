import type { Metadata } from 'next';
import { Icon } from '@/components/ui/icon';
import { StepHeader } from '@/components/app/step-header';
import { RowCard, SectionLabel } from '@/components/app/rows';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { NOTIFICATION_TOPICS } from '@bodgo/core';
import { PreferenceSwitch } from './switch-row';

export const metadata: Metadata = { title: 'Notificaciones' };

export default async function NotificationPrefsPage() {
  const user = await requireUser('pyme');
  const supabase = await createClient();

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('push, email, topics')
    .eq('profile_id', user.id)
    .maybeSingle();

  const topics = (prefs?.topics ?? {}) as Record<string, boolean>;

  return (
    <div className="pb-6">
      <StepHeader titulo="Notificaciones" volverA="/app/perfil" tomaLaPantalla={false} />

      <SectionLabel>Canal preferido</SectionLabel>
      <RowCard>
        <PreferenceSwitch
          campo="push"
          activo={prefs?.push ?? true}
          label="Push"
          hint="Avisos en el teléfono"
        />
        <PreferenceSwitch
          campo="email"
          activo={prefs?.email ?? true}
          label="Correo"
          hint={user.email ?? 'A tu correo de la cuenta'}
        />
      </RowCard>

      <SectionLabel>Qué quieres recibir</SectionLabel>
      <RowCard>
        {NOTIFICATION_TOPICS.map((t) => (
          <PreferenceSwitch
            key={t.key}
            campo={t.key}
            activo={topics[t.key] ?? true}
            label={t.label}
            hint={t.hint}
          />
        ))}
      </RowCard>

      <p className="mt-4 flex gap-2.5 rounded-[13px] bg-brand-50 p-3.5 text-[12px] leading-relaxed text-navy-800">
        <span className="mt-px shrink-0 text-brand-600">
          <Icon name="seguro" size={16} />
        </span>
        Los avisos de pago y de recepción en bodega llegan siempre. Es plata retenida y mercadería
        que llegó: enterarse tarde de eso te cuesta.
      </p>
    </div>
  );
}
