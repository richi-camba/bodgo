import type { Metadata } from 'next';
import { Icon } from '@/components/ui/icon';
import { StepHeader } from '@/components/app/step-header';
import { SectionLabel } from '@/components/app/rows';
import { requireUser } from '@/lib/session';
import { ChangePasswordForm } from './form';

export const metadata: Metadata = { title: 'Seguridad' };

export default async function SecurityPage() {
  const user = await requireUser('pyme');

  return (
    <div className="pb-6">
      <StepHeader titulo="Seguridad y contraseña" volverA="/app/perfil" tomaLaPantalla={false} />

      <SectionLabel>Cambiar contraseña</SectionLabel>
      <ChangePasswordForm email={user.email ?? ''} />

      <SectionLabel>Verificación en dos pasos</SectionLabel>
      <div className="rounded-[16px] border border-line-100 bg-white p-4">
        <p className="text-[13.5px] font-semibold text-navy-900">Todavía no disponible</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
          El prototipo la ofrece por SMS. Aún no hay proveedor de mensajería contratado, y un
          interruptor que no protege nada es peor que no tenerlo: da por segura una cuenta que no
          lo está.
        </p>
      </div>

      <p className="mt-4 flex gap-2.5 rounded-[13px] bg-brand-50 p-3.5 text-[12px] leading-relaxed text-navy-800">
        <span className="mt-px shrink-0 text-brand-600">
          <Icon name="seguro" size={16} />
        </span>
        Al cambiar la contraseña cerramos las demás sesiones. Si perdiste el acceso, pide un enlace
        de recuperación desde la pantalla de ingreso.
      </p>
    </div>
  );
}
