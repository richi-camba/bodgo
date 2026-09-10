import Image from 'next/image';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Faq } from '@/components/marketing/faq';
import { preguntasDe } from '@/components/marketing/faq-content';
import { FaqSchema } from '@/components/marketing/structured-data';
import { HostEarnings } from '@/components/marketing/host-earnings';
import { createClient } from '@/lib/supabase/server';
import { formatCLP, HOST_COMMISSION_RATE, INSURANCE_COVERAGE_CLP } from '@bodgo/core';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Arrienda tu bodega y genera ingresos',
  description:
    'Convierte una bodega, pieza o local desocupado en una microbodega BodGo. Sin costo de inscripción, con seguro incluido y pago garantizado a fin de mes. Calcula cuánto podrías ganar.',
  alternates: { canonical: '/para-bodegueros' },
};

const PASOS: { icon: IconName; t: string; d: string }[] = [
  {
    icon: 'espacios',
    t: 'Publicas tu espacio',
    d: 'Cargas la dirección, los metros y el precio que quieres cobrar. Toma unos cinco minutos y no cuesta nada.',
  },
  {
    icon: 'listo',
    t: 'Un evaluador lo visita',
    d: 'En 3 a 5 días hábiles pasa alguien de BodGo a revisar el checklist: acceso, piso, cierre, extintor y documentación. Recién ahí aparece en el buscador.',
  },
  {
    icon: 'recepciones',
    t: 'Recibes mercadería',
    d: 'Cuando una PyME contrata, te llega el aviso con el manifiesto. Cuentas lo que llega contra esa lista y lo confirmas con foto desde el teléfono.',
  },
  {
    icon: 'pedidos',
    t: 'Preparas los pedidos',
    d: 'Cuando la PyME vende, armas el paquete y se lo entregas al courier. La app te dice qué sacar y de dónde.',
  },
  {
    icon: 'pagos',
    t: 'Cobras a fin de mes',
    d: 'Depositamos a tu cuenta bancaria el arriendo del mes, neto de comisión. No tienes que perseguir a nadie para que te pague.',
  },
];

const REQUISITOS = [
  'Entre 8 y 15 m² libres: una bodega, una pieza, un local o parte de una.',
  'Acceso independiente, sin pasar por espacios privados de tu casa.',
  'Piso despejado y seco, sin humedad ni filtraciones.',
  'Puerta con cierre seguro, con llave o candado propio.',
  'Extintor con carga al día.',
  'Certificado de dominio o contrato de arriendo del espacio.',
];

const NO_HACES = [
  'No pones plata: no hay costo de inscripción ni de instalación.',
  'No buscas clientes: las PyMEs llegan por el buscador.',
  'No cobras tú: BodGo te deposita a fin de mes.',
  'No respondes por robo o incendio: para eso está el seguro de la red.',
];

export default async function ForHostsPage() {
  const supabase = await createClient();
  const { data: listings } = await supabase.from('warehouse_listings').select('price_per_m2');

  const precios = (listings ?? []).map((w) => w.price_per_m2 ?? 0).filter(Boolean);
  const promedio = precios.length
    ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length / 1000) * 1000
    : 42_000;

  const preguntas = preguntasDe('bodegueros', 'general');

  return (
    <>
      <FaqSchema preguntas={preguntas} />

      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <div className="absolute inset-0">
          <Image
            src="/fotos/bodeguero-espacio.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/92 to-navy-950/45 md:bg-gradient-to-r md:from-navy-950 md:via-navy-950/94 md:to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 md:pb-24 md:pt-24 lg:grid-cols-[1fr_460px]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">
              Para bodegueros
            </p>
            <h1 className="mt-4 max-w-xl text-[36px] font-extrabold leading-[1.06] tracking-[-0.025em] text-white md:text-[52px]">
              Ese espacio que tienes vacío puede pagarte la cuenta de la luz
            </h1>
            <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-white/70">
              Si tienes una bodega, una pieza o un local desocupado en Santiago, puedes arrendarlo
              a PyMEs que necesitan guardar su stock cerca de sus clientes. Sin costo de
              inscripción y con pago garantizado a fin de mes.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/registro?rol=bodeguero" size="lg">
                Publicar mi espacio
              </ButtonLink>
              <ButtonLink
                href="#requisitos"
                size="lg"
                variant="secondary"
                className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:border-white/35 hover:bg-white/15"
              >
                Ver requisitos
              </ButtonLink>
            </div>
          </div>

          <HostEarnings defaultPricePerM2={promedio} />
        </div>
      </section>

      {/* --------------------------------------------------------- cómo es */}
      <section className="border-b border-line-100 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-eyebrow">Cómo funciona</p>
          <h2 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
            De publicar el espacio a cobrar el primer mes
          </h2>

          <ol className="mt-12 space-y-8">
            {PASOS.map((paso, i) => (
              <li key={paso.t} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field bg-brand-50 text-brand-600">
                    <Icon name={paso.icon} size={19} />
                  </span>
                  {i < PASOS.length - 1 ? (
                    <span className="my-2 w-px flex-1 bg-line-200" aria-hidden />
                  ) : null}
                </div>
                <div className={i < PASOS.length - 1 ? 'pb-2' : ''}>
                  <h3 className="text-[18px] font-extrabold tracking-tight text-navy-900">
                    {paso.t}
                  </h3>
                  <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-ink-500">
                    {paso.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ requisitos */}
      <section id="requisitos" className="scroll-mt-16 border-b border-line-100 bg-surface-50 py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="text-eyebrow">Qué necesitas</p>
            <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[32px]">
              Los requisitos son estos, y nada más
            </h2>
            <ul className="mt-8 space-y-3.5">
              {REQUISITOS.map((r) => (
                <li key={r} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-success-700">
                    <Icon name="listo" size={17} />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-ink-700">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-eyebrow">Qué no tienes que hacer</p>
            <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[32px]">
              De esto nos ocupamos nosotros
            </h2>
            <ul className="mt-8 space-y-3.5">
              {NO_HACES.map((r) => (
                <li key={r} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-ink-400">
                    <Icon name="cerrar" size={16} />
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-ink-700">{r}</span>
                </li>
              ))}
            </ul>

            <p className="mt-8 rounded-card border border-line-200 bg-white p-5 text-[13.5px] leading-relaxed text-ink-700">
              El seguro de la red responde por robo e incendio hasta{' '}
              <strong className="font-bold text-navy-900">
                {formatCLP(INSURANCE_COVERAGE_CLP)}
              </strong>{' '}
              por PyME. Tú guardas la mercadería; no la respaldas con tu patrimonio.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- comisión */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-5">
          <p className="text-eyebrow">Sin letra chica</p>
          <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
            Cuánto se queda BodGo
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-700">
            El {Math.round(HOST_COMMISSION_RATE * 100)}% del arriendo. Eso cubre traerte las PyMEs,
            cobrarles, mantener el dinero en custodia hasta que confirmes la recepción, el seguro
            de la red y la aplicación con la que llevas todo desde el teléfono.
          </p>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-700">
            No hay costo de inscripción, ni mensualidad, ni comisión por pedido preparado. Si un
            mes tu espacio está vacío, no pagas nada.
          </p>

          <div className="mt-8 rounded-card bg-surface-50 p-6">
            <p className="text-[13.5px] leading-relaxed text-ink-700">
              <strong className="font-bold text-navy-900">Sobre el pago:</strong> a la PyME se le
              cobra por adelantado, pero ese dinero queda retenido —no es tuyo todavía— hasta que
              confirmas que recibiste su mercadería y que coincide con lo declarado. Es la misma
              garantía para los dos lados: ella sabe que no paga por un espacio que no existe, y tú
              sabes que el mes ya está pagado antes de guardar nada.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- preguntas */}
      <section className="border-t border-line-100 bg-surface-50 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-eyebrow text-center">Preguntas frecuentes</p>
          <h2 className="mt-3 text-center text-[28px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[34px]">
            Lo que preguntan los anfitriones
          </h2>
          <div className="mt-12">
            <Faq preguntas={preguntas} />
          </div>
        </div>
      </section>

      <section className="bg-navy-800 py-20 text-white">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] md:text-[34px]">
            Publica tu espacio hoy
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
            Crear la cuenta y publicar es gratis. Recién cuando una PyME contrata empiezas a
            cobrar.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href="/registro?rol=bodeguero"
              size="lg"
              variant="secondary"
              className="border-transparent bg-white text-navy-800 hover:bg-white/90"
            >
              Publicar mi espacio
            </ButtonLink>
            <ButtonLink
              href="/#contacto"
              size="lg"
              variant="secondary"
              className="border-white/25 bg-white/10 text-white hover:bg-white/15"
            >
              Tengo dudas, contáctenme
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
