import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Logo } from '@/components/ui/logo';
import { HeroCount } from '@/components/marketing/hero-count';
import { ContactForm } from '@/components/marketing/contact-form';
import { Faq } from '@/components/marketing/faq';
import { preguntasDe } from '@/components/marketing/faq-content';
import { FaqSchema, OrganizationSchema } from '@/components/marketing/structured-data';
import { Trust } from '@/components/marketing/trust';
import { createClient } from '@/lib/supabase/server';
import { calculateHostPayout, formatCLP, quoteContract } from '@bodgo/core';

// La red cambia poco de un minuto a otro; una revalidación por hora alcanza.
export const revalidate = 3600;

/**
 * Cifras de la portada. Salen de la red real, no de un mock: si todavía no hay
 * bodegas publicadas la home lo dice, en vez de inventar un número.
 */
async function loadNetworkStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('warehouse_listings')
    .select('comuna, capacity_m3, price_per_m2, total_m2');

  if (error || !data?.length) {
    return { warehouses: 0, comunas: 0, capacityM3: 0, desde: null, mejorNeto: null };
  }

  const precios = data.map((w) => w.price_per_m2 ?? 0).filter(Boolean);

  // Lo que gana el anfitrión mejor pagado de la red, para la franja de abajo.
  const netos = data.map((w) =>
    calculateHostPayout(Number(w.total_m2 ?? 0) * (w.price_per_m2 ?? 0)).net,
  );

  return {
    warehouses: data.length,
    comunas: new Set(data.map((w) => w.comuna)).size,
    capacityM3: Math.round(data.reduce((sum, w) => sum + Number(w.capacity_m3 ?? 0), 0)),
    desde: precios.length ? Math.min(...precios) : null,
    mejorNeto: netos.length ? Math.max(...netos) : null,
  };
}

/** Las tres razones del prototipo, en su mismo orden. */
const VALORES: { icon: IconName; titulo: string; texto: string }[] = [
  {
    icon: 'ubicacion',
    titulo: 'Entrega más rápido',
    texto: 'Acerca tu inventario a tus clientes mediante una red de microbodegas urbanas.',
  },
  {
    icon: 'inventario',
    titulo: 'Simplifica tu operación',
    texto: 'Gestiona inventario, preparación y despachos desde una sola plataforma.',
  },
  {
    icon: 'metricas',
    titulo: 'Escala a tu ritmo',
    texto: 'Pagas sólo por el espacio y el tiempo que necesitas, sin infraestructura propia.',
  },
];

export default async function HomePage() {
  const stats = await loadNetworkStats();
  const preguntas = preguntasDe('general', 'pymes');

  return (
    <>
      <OrganizationSchema />
      <FaqSchema preguntas={preguntas} />

      {/* ---------------------------------------------------------------- hero */}
      {/* A sangre y con la foto respirando a la derecha, como en el prototipo:
          el degradado oscurece donde va el texto y se despeja sobre la
          bodega. Un bloque navy plano tapaba la foto entera. */}
      <section className="relative flex min-h-[min(88vh,760px)] items-center overflow-hidden bg-navy-950">
        <div className="absolute inset-0">
          <Image
            src="/fotos/pyme-despacho.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_22%] md:object-[right_10%]"
          />
          <div className="hero-velo absolute inset-0" />
        </div>

        {/* Isotipos flotando sobre la foto. Decoración pura: fuera del orden
            de lectura y sin texto alternativo. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
          <Marca className="bodgo-flota absolute right-[8%] top-[14%] opacity-[0.14]" size={90} />
          <Marca
            className="bodgo-flota absolute right-[20%] top-[58%] opacity-[0.10]"
            size={60}
            delay="1.2s"
            duracion="8.5s"
          />
          <Marca
            className="bodgo-flota absolute -right-[2%] bottom-[6%] opacity-[0.09]"
            size={140}
            delay=".5s"
            duracion="9s"
          />
          <Marca
            className="bodgo-flota absolute right-[32%] top-[32%] opacity-[0.12]"
            size={44}
            delay="2s"
            duracion="6.5s"
          />
        </div>

        <div className="relative z-[2] w-full max-w-[640px] px-5 py-12 sm:px-8 md:px-16 md:py-[88px]">
          {/* Pastilla partida: el país en azul y la categoría al lado. */}
          <p className="inline-flex overflow-hidden rounded-[10px] border border-white/20 text-[11.5px] font-bold tracking-[0.04em]">
            <span className="flex items-center gap-1.5 bg-brand-600 px-3 py-2 text-white">
              <Logo size={14} markOnly tone="light" />
              CHILE
            </span>
            <span className="bg-white/[0.08] px-3.5 py-2 text-[#BBD2E8]">
              RED DE MICROBODEGAS URBANAS
            </span>
          </p>

          <h1 className="mt-[22px] text-[clamp(36px,5.5vw,60px)] font-extrabold leading-[1.03] tracking-[-0.033em] text-white">
            Tu inventario,
            <br />
            más cerca de
            <br />
            tus clientes
          </h1>

          <p className="mt-5 max-w-[500px] text-[clamp(16px,2vw,19px)] leading-[1.6] text-white/80">
            Acerca tu inventario a tus clientes con una red de microbodegas urbanas. Gestiona stock,
            preparación y despachos desde una sola plataforma, y paga sólo por el espacio y el
            tiempo que necesitas.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              href="/registro"
              className="rounded-[13px] bg-brand-600 px-7 py-4 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(44,114,183,.4)] transition-colors hover:bg-brand-700"
            >
              Empieza gratis
            </Link>
            <Link
              href="#como-funciona"
              className="rounded-[13px] border-[1.5px] border-white/35 bg-white/[0.12] px-7 py-4 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Cómo funciona
            </Link>
          </div>

          <dl className="mt-11 flex flex-wrap gap-x-[clamp(28px,5vw,52px)] gap-y-6">
            <HeroStat
              valor={<HeroCount to={stats.warehouses} />}
              label={stats.warehouses === 1 ? 'bodega activa' : 'bodegas activas'}
            />
            <HeroStat
              valor={<HeroCount to={stats.comunas} />}
              label={stats.comunas === 1 ? 'comuna cubierta' : 'comunas cubiertas'}
            />
            <HeroStat
              valor={
                stats.capacityM3 > 0 ? (
                  <>
                    <HeroCount to={stats.capacityM3} /> m³
                  </>
                ) : (
                  '24/7'
                )
              }
              label={stats.capacityM3 > 0 ? 'de capacidad publicada' : 'acceso a tu espacio'}
            />
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------ caminos */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <p className="text-eyebrow">Dos formas de empezar</p>
        <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[38px]">
          ¿Con cuál te identificas?
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <PathCard
            eyebrow="Tengo una PyME"
            icon="inventario"
            title="Vendo online y necesito espacio"
            body="Guarda tu stock cerca de tus clientes y despacha más rápido, sin arrendar una bodega completa ni contratar personal."
            cta="Ver microbodegas"
            href="/bodegas"
          />
          <PathCard
            eyebrow="Quiero ser bodeguero"
            icon="espacios"
            title="Tengo espacio y quiero rentabilizarlo"
            body="Convierte tu bodega o local en una microbodega BodGo: recibe mercancía, prepara pedidos y genera ingresos con lo que ya tienes."
            cta="Cómo funciona para mí"
            href="/para-bodegueros"
            dark
          />
        </div>
      </section>

      {/* -------------------------------------------------- por qué BodGo */}
      {/* Banda navy con tres tarjetas blancas numeradas, como en el
          prototipo: la franja oscura corta la portada y hace que las
          tarjetas floten en vez de seguir apiladas sobre blanco. */}
      <section className="bg-gradient-to-b from-navy-800 to-navy-950 px-5 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-[600px] text-center">
            <span className="inline-block rounded-pill bg-white/[0.12] px-3 py-1.5 text-[12px] font-bold tracking-[0.03em] text-[#BBD2E8]">
              Por qué BodGo
            </span>
            <h2 className="mt-3.5 text-[clamp(26px,4vw,34px)] font-extrabold leading-tight tracking-[-0.025em] text-white">
              Entrega más rápido, simplifica tu operación y crece sin infraestructura propia.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-white/70">
              Administra tu inventario desde una red de microbodegas urbanas y escala tu operación
              sin invertir en infraestructura propia. Pagas sólo por el espacio y el tiempo que
              realmente necesitas.
            </p>
          </div>

          <ul className="mt-9 grid gap-5 md:grid-cols-3">
            {VALORES.map((v, i) => (
              <li
                key={v.titulo}
                className="relative overflow-hidden rounded-[20px] bg-white px-[26px] pb-7 pt-[30px] shadow-[0_12px_30px_rgba(8,22,40,.22)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-600 to-brand-400"
                />
                <span
                  aria-hidden
                  className="absolute right-[26px] top-[22px] text-[34px] font-extrabold leading-none tracking-[-1px] text-surface-50"
                >
                  0{i + 1}
                </span>

                <span className="relative mb-5 flex h-[54px] w-[54px] items-center justify-center rounded-[16px] bg-navy-800 text-white shadow-[0_6px_16px_rgba(22,54,90,.18)]">
                  <Icon name={v.icon} size={26} />
                </span>

                <h3 className="relative text-[18px] font-extrabold tracking-[-0.02em] text-navy-900">
                  {v.titulo}
                </h3>
                <span aria-hidden className="my-3 block h-0.5 w-7 bg-line-200" />
                <p className="relative text-[14.5px] leading-[1.65] text-ink-500">{v.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------- cómo funciona */}
      <section
        id="como-funciona"
        className="scroll-mt-16 border-y border-line-100 bg-surface-50 py-20 md:py-24"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="text-eyebrow">En 3 pasos</p>
            <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
              Cómo funciona
            </h2>

            <ol className="mt-9 space-y-7">
              {[
                {
                  t: 'Contrata una microbodega',
                  d: 'Eliges un espacio cerca de tu demanda y pagas por mes. Tu pago queda en custodia hasta que confirmes que todo llegó bien.',
                },
                {
                  t: 'Envías y administras tu stock',
                  d: 'Despachas con un manifiesto de SKUs. El bodeguero cuenta contra esa lista y confirma la recepción con foto.',
                },
                {
                  t: 'Despachas desde el punto más cercano',
                  d: 'Cuando vendes, el bodeguero prepara el pedido y sale con el courier que elijas. Tu comprador recibe un enlace para seguirlo.',
                },
              ].map((step, i) => (
                <li key={step.t} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[14px] font-extrabold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[17.5px] font-extrabold tracking-tight text-navy-900">
                      {step.t}
                    </h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-500">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] shadow-lift lg:aspect-[5/4]">
            <Image
              src="/fotos/pyme-operacion.jpg"
              alt="Una PyME preparando pedidos en su microbodega"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- confianza */}
      <Trust />

      {/* ------------------------------------------------- las dos páginas */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="grid gap-5 md:grid-cols-2">
          <DeepLink
            eyebrow="Precios"
            title={
              stats.desde
                ? `Desde ${formatCLP(stats.desde)} por m² al mes`
                : 'Paga sólo por el espacio que necesitas'
            }
            body={
              stats.desde
                ? `Un rincón de 2 m² sale ${formatCLP(quoteContract(2, stats.desde).total)} al mes, con la comisión del 8% ya incluida. Sin plazo mínimo ni costo de instalación.`
                : 'Arriendo mensual por metro cuadrado, con la comisión de plataforma incluida en el precio que ves.'
            }
            cta="Ver precios y qué incluye"
            href="/precios"
          />
          <DeepLink
            eyebrow="Para bodegueros"
            title="Convierte espacio vacío en ingresos"
            body={
              stats.mejorNeto
                ? `El espacio mejor pagado de la red rinde ${formatCLP(stats.mejorNeto)} netos al mes con todos sus metros arrendados. Lo tuyo depende de cuántos metros tengas y de lo que cobres — la calculadora lo estima.`
                : 'Si tienes entre 8 y 15 m² desocupados, puedes arrendarlos a PyMEs que necesitan guardar cerca de sus clientes. Sin costo de inscripción y con pago a fin de mes.'
            }
            cta="Calcular cuánto ganaría"
            href="/para-bodegueros"
            dark
          />
        </div>
      </section>

      {/* ------------------------------------------------------------ faq */}
      <section
        id="preguntas"
        className="scroll-mt-16 border-t border-line-100 bg-surface-50 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-eyebrow text-center">Preguntas frecuentes</p>
          <h2 className="mt-3 text-center text-[30px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[38px]">
            Lo que más nos preguntan
          </h2>

          <div className="mt-12">
            <Faq preguntas={preguntas} />
          </div>

          <p className="mt-8 text-center text-[14px] text-ink-500">
            Sobre precios y plazos hay más en{' '}
            <Link href="/precios" className="font-bold text-brand-600 hover:underline">
              la página de precios
            </Link>
            ; si tienes un espacio, en{' '}
            <Link href="/para-bodegueros" className="font-bold text-brand-600 hover:underline">
              la de bodegueros
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- contacto */}
      <section id="contacto" className="scroll-mt-16 py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-eyebrow">Hablemos</p>
            <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
              ¿Todavía no llegamos a tu comuna?
            </h2>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-500">
              La red crece donde hay demanda. Déjanos tu contacto y te avisamos apenas abramos
              cerca tuyo — o si tienes un espacio, cuándo pasa el evaluador.
            </p>

            <div className="mt-8 space-y-4">
              <ContactPoint
                title="¿Prefieres escribir?"
                value="hola@bodgo.cl"
                href="mailto:hola@bodgo.cl"
              />
              <ContactPoint
                title="¿Ya eres cliente y necesitas ayuda?"
                value="ayuda@bodgo.cl"
                href="mailto:ayuda@bodgo.cl"
              />
            </div>

            <div className="mt-8">
              <ButtonLink href="/registro" size="lg">
                Crear cuenta gratis
              </ButtonLink>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}

function HeroStat({ valor, label }: { valor: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[30px] font-extrabold leading-none tracking-[-0.5px] text-white">
          {valor}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-white/60">{label}</span>
      </dd>
    </div>
  );
}

/** Isotipo suelto, para la decoración flotante del hero. */
function Marca({
  className,
  size,
  delay,
  duracion,
}: {
  className: string;
  size: number;
  delay?: string;
  duracion?: string;
}) {
  return (
    <span
      className={className}
      style={{ animationDelay: delay, animationDuration: duracion }}
    >
      <Logo size={size} markOnly tone="light" />
    </span>
  );
}

function ContactPoint({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <div>
      <p className="text-[12.5px] text-ink-500">{title}</p>
      <a href={href} className="text-[15px] font-bold text-brand-600 hover:underline">
        {value}
      </a>
    </div>
  );
}

/** Tarjeta que resume un tema y manda a su página. */
function DeepLink({
  eyebrow,
  title,
  body,
  cta,
  href,
  dark,
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <div className={`flex flex-col rounded-[20px] p-8 ${dark ? 'bg-navy-800 text-white' : 'card'}`}>
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.1em] ${
          dark ? 'text-brand-400' : 'text-brand-600'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-[24px] font-extrabold leading-tight tracking-[-0.02em] ${
          dark ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-3 flex-1 text-[14.5px] leading-relaxed ${
          dark ? 'text-white/70' : 'text-ink-500'
        }`}
      >
        {body}
      </p>
      <ButtonLink
        href={href}
        variant={dark ? 'secondary' : 'primary'}
        className={`mt-7 self-start ${dark ? 'border-transparent bg-white text-navy-800 hover:bg-white/90' : ''}`}
      >
        {cta}
      </ButtonLink>
    </div>
  );
}

function PathCard({
  eyebrow,
  icon,
  title,
  body,
  cta,
  href,
  dark,
}: {
  eyebrow: string;
  icon: IconName;
  title: string;
  body: string;
  cta: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <div className={`flex flex-col rounded-[20px] p-8 ${dark ? 'bg-navy-800 text-white' : 'card'}`}>
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-field ${
          dark ? 'bg-white/10 text-brand-400' : 'bg-brand-50 text-brand-600'
        }`}
      >
        <Icon name={icon} size={20} />
      </span>

      <p
        className={`mt-5 text-[11px] font-bold uppercase tracking-[0.1em] ${
          dark ? 'text-brand-400' : 'text-brand-600'
        }`}
      >
        {eyebrow}
      </p>
      <h3
        className={`mt-2 text-[21px] font-extrabold leading-tight tracking-tight ${
          dark ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h3>
      <p className={`mt-3 flex-1 text-[14.5px] leading-relaxed ${dark ? 'text-white/70' : 'text-ink-500'}`}>
        {body}
      </p>
      <ButtonLink
        href={href}
        variant={dark ? 'secondary' : 'primary'}
        className={`mt-7 self-start ${dark ? 'border-transparent bg-white text-navy-800 hover:bg-white/90' : ''}`}
      >
        {cta}
      </ButtonLink>
    </div>
  );
}
