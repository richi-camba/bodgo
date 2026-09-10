import { Icon, type IconName } from '@/components/ui/icon';
import { formatCompactCLP, INSURANCE_COVERAGE_CLP, PLATFORM_COMMISSION_RATE } from '@bodgo/core';

/**
 * Razones para confiar, verificables.
 *
 * El prototipo tenía acá un carrusel de testimonios. Con cero clientes reales,
 * inventar citas de PyMEs sería fabricar prueba social en un sitio público:
 * en su lugar van los respaldos que sí se pueden comprobar.
 */
const REASONS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'pagos',
    title: 'Tu pago queda en custodia',
    body: 'Se cobra al contratar, pero al bodeguero recién se le paga cuando confirma que recibió tu mercadería. Si algo no llega como lo declaraste, el dinero sigue retenido.',
  },
  {
    icon: 'seguro',
    title: `Seguro de contenido hasta ${formatCompactCLP(INSURANCE_COVERAGE_CLP)}`,
    body: 'Toda microbodega publicada queda cubierta por el seguro de la red, que responde por robo e incendio. Sin costo adicional.',
  },
  {
    icon: 'listo',
    title: 'Espacios verificados uno por uno',
    body: 'Antes de publicar, un evaluador visita el espacio y revisa acceso, cierre, extintor y documentación. Recién ahí aparece en el buscador.',
  },
  {
    icon: 'discrepancias',
    title: 'Cada recepción se cuenta y se fotografía',
    body: 'El bodeguero verifica producto por producto contra tu manifiesto. Si no calza, se abre una discrepancia al instante y te llega el detalle.',
  },
];

export function Trust() {
  return (
    <section className="border-y border-line-100 bg-white py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-eyebrow">Por qué confiar</p>
        <h2 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
          Tu stock queda en casa de un desconocido. Esto es lo que lo respalda.
        </h2>

        <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <li key={reason.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-brand-50 text-brand-600">
                <Icon name={reason.icon} size={19} />
              </span>
              <div>
                <h3 className="text-[16px] font-extrabold tracking-tight text-navy-900">
                  {reason.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">{reason.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 border-t border-line-100 pt-6 text-[13px] text-ink-400">
          La comisión de plataforma es de {Math.round(PLATFORM_COMMISSION_RATE * 100)}% y va incluida
          en el precio que ves. No hay costo de inscripción ni de instalación.
        </p>
      </div>
    </section>
  );
}
