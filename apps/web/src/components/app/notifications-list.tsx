import { Icon, type IconName } from '@/components/ui/icon';
import { EmptyState, PageHeader } from '@/components/ui/stat';
import { createClient } from '@/lib/supabase/server';
import { MarkAllRead } from './mark-all-read';

/** Cada clase de aviso trae su propio icono, para reconocerlo sin leerlo. */
const ICONO: Record<string, IconName> = {
  contract_active: 'pagos',
  contract_new: 'contratos',
  contract_ended: 'contratos',
  payment_failed: 'pagos',
  reception_ok: 'recibido',
  reception_discrepancy: 'discrepancias',
  shipment_incoming: 'envios',
  courier_registered: 'envios',
  warehouse_approved: 'listo',
  warehouse_rejected: 'discrepancias',
};

const TONO: Record<string, string> = {
  payment_failed: 'bg-danger-50 text-danger-700',
  reception_discrepancy: 'bg-danger-50 text-danger-700',
  warehouse_rejected: 'bg-danger-50 text-danger-700',
  reception_ok: 'bg-success-50 text-success-700',
  warehouse_approved: 'bg-success-50 text-success-700',
  contract_active: 'bg-success-50 text-success-700',
};

function cuando(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'recién';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export async function NotificationsList() {
  const supabase = await createClient();

  const { data: avisos } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(60);

  const sinLeer = (avisos ?? []).filter((a) => !a.read_at).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notificaciones"
        subtitle={
          sinLeer > 0
            ? `${sinLeer} sin leer`
            : 'Los avisos de pago y de recepción llegan siempre, aunque apagues el resto.'
        }
        action={sinLeer > 0 ? <MarkAllRead /> : undefined}
      />

      {!avisos?.length ? (
        <EmptyState
          icon="notificaciones"
          title="Nada por aquí"
          body="Te avisamos cuando pase algo con tus contratos, envíos o pedidos."
        />
      ) : (
        <ul className="space-y-2.5">
          {avisos.map((aviso) => {
            const Contenido = (
              <>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-field ${
                    TONO[aviso.kind] ?? 'bg-brand-50 text-brand-600'
                  }`}
                >
                  <Icon name={ICONO[aviso.kind] ?? 'notificaciones'} size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-navy-900">{aviso.title}</p>
                  {aviso.body ? (
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{aviso.body}</p>
                  ) : null}
                  <p className="mt-1 text-[11.5px] text-ink-400">{cuando(aviso.created_at)}</p>
                </div>

                {!aviso.read_at ? (
                  <span
                    aria-label="Sin leer"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600"
                  />
                ) : null}
              </>
            );

            return (
              <li key={aviso.id}>
                {aviso.link ? (
                  <a
                    href={aviso.link}
                    className={`card flex gap-3.5 p-4 transition-shadow hover:shadow-card ${
                      aviso.read_at ? '' : 'border-brand-100 bg-brand-50/25'
                    }`}
                  >
                    {Contenido}
                  </a>
                ) : (
                  <div className={`card flex gap-3.5 p-4 ${aviso.read_at ? '' : 'border-brand-100 bg-brand-50/25'}`}>
                    {Contenido}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
