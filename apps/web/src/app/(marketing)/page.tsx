import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Logo } from '@/components/ui/logo';
import { HeroCount } from '@/components/marketing/hero-count';
import { ContactForm } from '@/components/marketing/contact-form';
import { Faq } from '@/components/marketing/faq';
import { preguntasDe } from '@/components/marketing/faq-content';
import { PricingCalculator } from '@/components/marketing/pricing-calculator';
import { FaqSchema, OrganizationSchema } from '@/components/marketing/structured-data';
import { Trust } from '@/components/marketing/trust';
import { createClient } from '@/lib/supabase/server';
import { calculateHostPayout, formatCLP } from '@bodgo/core';

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
    texto: 'Gestiona inventario, picking y despachos desde una sola plataforma.',
  },
  {
    icon: 'metricas',
    titulo: 'Escala a tu ritmo',
    texto: 'Paga sólo por el espacio y el tiempo que necesitas, sin infraestructura propia.',
  },
];

/** Los tres pasos del prototipo, con su misma redacción. */
const PASOS = [
  {
    titulo: 'Crea tu red de almacenamiento',
    texto:
      'Almacena tus productos en una o varias microbodegas urbanas según la demanda y la ubicación de tus clientes.',
  },
  {
    titulo: 'Administra toda tu operación',
    texto:
      'Gestiona inventario, pedidos, picking y despachos desde una sola plataforma, sin importar cuántas microbodegas utilices.',
  },
  {
    titulo: 'Decide desde dónde despachar',
    texto: 'Visualiza tu operación y elige la mejor ubicación para preparar y enviar cada pedido.',
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
      {/* Dos tarjetas con la foto a sangre y el texto apoyado abajo sobre el
          degradado, como en el prototipo. La versión con icono sobre fondo
          plano perdía justamente lo que hace elegir: ver el lugar. */}
      <section className="bg-white px-5 py-[clamp(48px,6vw,72px)]">
        <div className="mx-auto max-w-[1080px]">
          <div className="text-center">
            <span className="inline-block rounded-pill bg-brand-50 px-3 py-1.5 text-[12px] font-bold tracking-[0.03em] text-brand-600">
              DOS FORMAS DE EMPEZAR
            </span>
            <h2 className="mt-3.5 text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-0.025em] text-navy-900">
              ¿Con cuál te identificas?
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <PathCard
              foto="/fotos/camino-pyme.jpg"
              eyebrow="TENGO UNA PYME"
              title="Vendo online y necesito espacio"
              body="Guarda tu stock cerca de tus clientes y despacha más rápido, sin arrendar una bodega completa."
              cta="Buscar bodega"
              href="/bodegas"
            />
            <PathCard
              foto="/fotos/camino-bodeguero.jpg"
              eyebrow="QUIERO SER BODEGUERO"
              title="Tengo espacio y quiero rentabilizarlo"
              body="Convierte tu bodega o local en una microbodega BodGo: recibe mercancía, prepara pedidos y genera ingresos."
              cta="Empezar a ganar"
              href="/para-bodegueros"
            />
          </div>
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
        className="scroll-mt-16 border-t border-line-100 bg-white px-5 py-[clamp(48px,6vw,72px)]"
      >
        <div className="mx-auto max-w-[1080px]">
          <div className="text-center">
            <span className="inline-block rounded-pill bg-brand-50 px-3 py-1.5 text-[12px] font-bold tracking-[0.03em] text-brand-600">
              EN 3 PASOS
            </span>
            <h2 className="mt-3.5 text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-0.025em] text-navy-900">
              Cómo funciona
            </h2>
          </div>

          <ol className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-navy-800 text-[22px] font-extrabold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-[18px] text-[18px] font-bold tracking-tight text-navy-900">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink-500">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ bodegueros */}
      {/* Banda con foto de fondo y las cuatro cifras en vidrio, como en el
          prototipo. Las cifras son de la red real cuando hay red. */}
      <section className="relative overflow-hidden px-5 py-[clamp(48px,6vw,72px)]">
        <Image
          src="/fotos/banda-bodegueros.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(160deg,rgb(22_54_90/0.97)_0%,rgb(15_39_66/0.9)_45%,rgb(15_39_66/0.7)_100%)]"
        />

        <div className="relative z-[2] mx-auto flex max-w-[1080px] flex-wrap items-center gap-[clamp(32px,5vw,60px)]">
          <div className="min-w-[280px] flex-1">
            <span className="inline-block rounded-pill bg-white/[0.12] px-3 py-1.5 text-[12px] font-bold tracking-[0.03em] text-[#BBD2E8]">
              PARA BODEGUEROS
            </span>
            <h2 className="mt-4 text-[clamp(26px,4vw,34px)] font-extrabold leading-[1.1] tracking-[-0.025em] text-white">
              Convierte espacio disponible en nuevos ingresos
            </h2>
            <p className="mt-3.5 max-w-[440px] text-[16px] leading-relaxed text-white/75">
              Únete a la red BodGo y conecta tu bodega con empresas que necesitan almacenar más
              cerca de sus clientes.
            </p>
            <Link
              href="/para-bodegueros"
              className="mt-[26px] inline-block rounded-[13px] bg-white px-[26px] py-[15px] text-[15px] font-bold text-navy-800 transition-colors hover:bg-white/90"
            >
              Quiero ser bodeguero
            </Link>
          </div>

          <dl className="grid min-w-[280px] flex-1 grid-cols-2 gap-3.5">
            <VidrioStat
              valor={stats.mejorNeto ? formatCLP(stats.mejorNeto) : '$640k'}
              label="ingreso mensual del mejor espacio"
            />
            <VidrioStat valor="14–27 m³" label="por microbodega" />
            <VidrioStat valor="0%" label="costo de inscripción" />
            <VidrioStat valor="Fin de mes" label="pago garantizado" />
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------- precios */}
      <section
        id="precios"
        className="scroll-mt-16 border-t border-line-100 bg-white px-5 py-[clamp(48px,6vw,72px)]"
      >
        <div className="mx-auto max-w-[1080px]">
          <div className="text-center">
            <span className="inline-block rounded-pill bg-brand-50 px-3 py-1.5 text-[12px] font-bold tracking-[0.03em] text-brand-600">
              PRECIOS
            </span>
            <h2 className="mt-3.5 text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-0.025em] text-navy-900">
              Paga sólo por el espacio que necesitas
            </h2>
            <p className="mt-2.5 text-[16px] text-ink-500">
              Arriendo mensual o por días. Comisión de plataforma de 8% incluida en cada operación.
            </p>
          </div>

          <div className="mt-9">
            <PricingCalculator />
          </div>

          <p className="mt-6 text-center text-[13px] text-ink-400">
            Incluye pago en custodia y seguro de contenido. Sin costo de instalación.
          </p>
          <p className="mt-[22px] text-center">
            <Link
              href="/registro"
              className="inline-block rounded-[13px] bg-navy-800 px-9 py-[15px] text-[15px] font-bold text-white transition-colors hover:bg-navy-900"
            >
              Empieza hoy
            </Link>
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------- confianza */}
      <Trust />

      {/* ------------------------------------------------------------ faq */}
      <section
        id="preguntas"
        className="scroll-mt-16 border-t border-line-100 bg-surface-50 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <span className="inline-block rounded-pill bg-brand-50 px-3 py-1.5 text-[12px] font-bold tracking-[0.03em] text-brand-600">
              PREGUNTAS FRECUENTES
            </span>
            <h2 className="mt-3.5 text-[clamp(26px,4vw,34px)] font-extrabold tracking-[-0.025em] text-navy-900">
              Todo lo que necesitas saber
            </h2>
          </div>

          <div className="mt-12">
            <Faq preguntas={preguntas} />
          </div>

          <p className="mt-8 text-center text-[14px] text-ink-500">
            ¿Tienes otra pregunta?{' '}
            <a href="mailto:hola@bodgo.cl" className="font-bold text-brand-600 hover:underline">
              Escríbenos a hola@bodgo.cl
            </a>
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

      {/* ---------------------------------------------------- cierre */}
      <section className="bg-[linear-gradient(135deg,#16365A,#0f2742)] px-5 py-[clamp(40px,6vw,56px)] text-center text-white">
        <h2 className="text-[clamp(24px,4vw,30px)] font-extrabold tracking-[-0.02em]">
          Lleva tu e-commerce más cerca de tus clientes
        </h2>
        <p className="mt-3 text-[16px] text-white/70">
          Encuentra tu primera microbodega en minutos.
        </p>
        <Link
          href="/registro"
          className="mt-6 inline-block rounded-[13px] bg-white px-[30px] py-[15px] text-[15px] font-bold text-navy-800 transition-colors hover:bg-white/90"
        >
          Empieza gratis
        </Link>
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

function PathCard({
  foto,
  eyebrow,
  title,
  body,
  cta,
  href,
}: {
  foto: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block h-[440px] overflow-hidden rounded-[24px] shadow-[0_12px_34px_rgba(16,36,58,.14)]"
    >
      <Image
        src={foto}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgb(9_23_40/0.92)_8%,rgb(9_23_40/0.55)_45%,rgb(9_23_40/0.15)_100%)]"
      />

      <span className="absolute inset-x-0 bottom-0 block p-[30px]">
        <span className="inline-block rounded-pill border border-[rgb(126_179_230/0.6)] bg-[rgb(91_166_230/0.32)] px-3 py-1.5 text-[11px] font-bold tracking-[0.05em] text-[#EAF4FF] backdrop-blur-[6px]">
          {eyebrow}
        </span>
        <span className="mt-3.5 block text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
          {title}
        </span>
        <span className="mt-2.5 block text-[14px] leading-[1.55] text-white/80">{body}</span>
        <span className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-white px-[22px] py-[13px] text-[14px] font-bold text-navy-800">
          {cta}
          <Icon name="siguiente" size={13} />
        </span>
      </span>
    </Link>
  );
}

/** Cifra sobre vidrio, para la banda de bodegueros. */
function VidrioStat({ valor, label }: { valor: string; label: string }) {
  return (
    <div className="rounded-[16px] border border-white/[0.14] bg-white/[0.08] p-5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[28px] font-extrabold tracking-[-0.5px] text-white">
          {valor}
        </span>
        <span className="mt-1 block text-[13px] leading-snug text-white/60">{label}</span>
      </dd>
    </div>
  );
}
