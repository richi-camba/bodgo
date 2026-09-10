import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WelcomeShell } from '@/components/app/welcome';
import { Icon } from '@/components/ui/icon';
import { PymeBusinessStep, PymeChannelsStep, PymeInventoryStep } from './pyme-steps';
import { HostIdentityStep, HostSpaceStep, TerminarBienvenida } from './host-steps';

export const metadata: Metadata = { title: 'Bienvenida' };

const TOTAL = 3;

/**
 * Puesta en marcha de la cuenta, para PyME y para bodeguero.
 *
 * Vive fuera de `/app` y de `/bodeguero` a propósito: la bienvenida no lleva
 * barra de pestañas, y meterla dentro de esos layouts invitaría a irse a
 * secciones que todavía están vacías. El middleware manda acá mientras
 * `profiles.onboarded_at` esté en nulo.
 */
export default async function Bienvenida({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string }>;
}) {
  const { paso } = await searchParams;
  const n = paso === '3' ? 3 : paso === '2' ? 2 : 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/ingresar?next=%2Fbienvenida');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role, full_name, onboarded_at')
    .eq('id', user.id)
    .single();

  if (!perfil) redirect('/ingresar');
  if (perfil.onboarded_at) redirect(perfil.role === 'bodeguero' ? '/bodeguero' : '/app');
  if (perfil.role === 'admin') redirect('/admin');

  return perfil.role === 'bodeguero'
    ? bodeguero(supabase, user.id, perfil.full_name, n)
    : pyme(supabase, user.id, n);
}

type Cliente = Awaited<ReturnType<typeof createClient>>;

async function pyme(supabase: Cliente, userId: string, n: number) {
  const { data: perfil } = await supabase
    .from('pyme_profiles')
    .select('business_name, comuna, giro')
    .eq('profile_id', userId)
    .single();

  if (n === 1) {
    return (
      <PymeBusinessStep
        total={TOTAL}
        businessName={perfil?.business_name ?? ''}
        comuna={perfil?.comuna ?? ''}
        giro={perfil?.giro ?? ''}
      />
    );
  }

  if (n === 2) {
    return (
      <WelcomeShell
        paso={2}
        total={TOTAL}
        titulo="Carga tu inventario"
        bajada="Sube tus productos por CSV o agrégalos de a uno más tarde. El volumen unitario es lo que después nos deja avisarte si un envío no cabe."
        acciones={<PymeInventoryStep />}
        saltar={false}
      />
    );
  }

  return <PymeChannelsStep total={TOTAL} />;
}

async function bodeguero(supabase: Cliente, userId: string, fullName: string, n: number) {
  if (n === 1) {
    const { data: host } = await supabase
      .from('bodeguero_profiles')
      .select('rut, phone')
      .eq('profile_id', userId)
      .single();

    return (
      <HostIdentityStep
        total={TOTAL}
        fullName={fullName}
        rut={host?.rut ?? ''}
        phone={host?.phone ?? ''}
      />
    );
  }

  if (n === 2) return <HostSpaceStep total={TOTAL} />;

  // Paso 3: el checklist real del espacio recién publicado. Lo crea un
  // trigger de la base al insertar la microbodega, así que lo que se ve acá
  // es lo que el evaluador va a revisar en la visita.
  const { data: espacio } = await supabase
    .from('warehouses')
    .select('id, comuna, warehouse_checklist(item, hint, status)')
    .eq('bodeguero_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const items = espacio?.warehouse_checklist ?? [];

  return (
    <WelcomeShell
      paso={3}
      total={TOTAL}
      titulo="Checklist de habilitación"
      bajada={
        espacio
          ? `Tu espacio en ${espacio.comuna} quedó enviado a revisión. Un evaluador de BodGo agenda la visita en 3 a 5 días hábiles y comprueba estos puntos.`
          : 'Estos son los puntos que BodGo comprueba en la visita antes de publicar un espacio.'
      }
      acciones={<TerminarBienvenida />}
      saltar={false}
    >
      <ul className="mt-5 space-y-2.5">
        {(items.length
          ? items
          : [
              { item: 'Contrato firmado', hint: 'Documento en línea', status: 'pending' },
              { item: 'Seguro vigente', hint: 'Póliza de contenido', status: 'pending' },
              { item: 'Fotos del espacio', hint: 'Mínimo 3 imágenes', status: 'pending' },
            ]
        ).map((c) => {
          const listo = c.status === 'ok';
          return (
            <li
              key={c.item}
              className="flex items-center gap-3 rounded-[13px] border border-line-100 bg-white p-3.5"
            >
              <span
                aria-hidden
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] ${
                  listo ? 'bg-success-600 text-white' : 'border-2 border-line-300'
                }`}
              >
                {listo ? <Icon name="listo" size={13} /> : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-navy-900">{c.item}</p>
                {c.hint ? <p className="mt-px text-[11px] text-ink-500">{c.hint}</p> : null}
              </div>
              <span
                className={`shrink-0 text-[11px] font-bold ${listo ? 'text-success-700' : 'text-warning-700'}`}
              >
                {listo ? 'Listo' : 'Pendiente'}
              </span>
            </li>
          );
        })}
      </ul>
    </WelcomeShell>
  );
}
