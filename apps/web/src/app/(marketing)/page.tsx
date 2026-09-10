import Image from 'next/image';
import { ButtonLink } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Faq } from '@/components/marketing/faq';
import { PricingCalculator } from '@/components/marketing/pricing-calculator';
import { Trust } from '@/components/marketing/trust';
import { createClient } from '@/lib/supabase/server';
import { formatCompactCLP, formatNumber, HOST_COMMISSION_RATE } from '@bodgo/core';

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
    .select('comuna, available_m2, capacity_m3');

  if (error || !data) return { warehouses: 0, comunas: 0, capacityM3: 0 };

  return {
    warehouses: data.length,
    comunas: new Set(data.map((w) => w.comuna)).size,
    capacityM3: Math.round(data.reduce((sum, w) => sum + Number(w.capacity_m3 ?? 0), 0)),
  };
}

export default async function HomePage() {
  const stats = await loadNetworkStats();

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <div className="absolute inset-0">
          <Image
            src="/fotos/pyme-despacho.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_22%] md:object-[70%_center]"
          />
          {/* En escritorio el degradado corre en horizontal: el texto ocupa la
              izquierda y la foto respira a la derecha. En el teléfono la
              columna es todo el ancho, así que va en vertical — oscuro arriba
              donde está el titular, y clareando abajo para que se vea la
              foto en vez de un bloque navy plano. */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/92 to-navy-950/45 md:bg-gradient-to-r md:from-navy-950 md:via-navy-950/94 md:to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 pb-28 pt-16 md:pb-28 md:pt-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">
            Chile · Red de microbodegas urbanas
          </p>
          <h1 className="mt-5 max-w-2xl text-[42px] font-extrabold leading-[1.04] tracking-[-0.025em] text-white md:text-[64px]">
            Tu inventario, más cerca de tus clientes
          </h1>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-white/70 md:text-[17.5px]">
            Guarda tu stock en microbodegas urbanas cerca de tu demanda. Gestiona inventario,
            picking y despachos desde una sola plataforma, y paga sólo por el espacio y el tiempo
            que necesitas.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/registro" size="lg">
              Empieza gratis
            </ButtonLink>
            <ButtonLink
              href="#como-funciona"
              size="lg"
              variant="secondary"
              className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:border-white/35 hover:bg-white/15"
            >
              Cómo funciona
            </ButtonLink>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/15 pt-7 sm:mt-16 sm:gap-8 sm:pt-8">
            <HeroStat
              value={stats.warehouses > 0 ? String(stats.warehouses) : '—'}
              label={stats.warehouses === 1 ? 'bodega activa' : 'bodegas activas'}
            />
            <HeroStat
              value={stats.comunas > 0 ? String(stats.comunas) : '—'}
              label={stats.comunas === 1 ? 'comuna cubierta' : 'comunas cubiertas'}
            />
            <HeroStat
              value={stats.capacityM3 > 0 ? `${formatNumber(stats.capacityM3)} m³` : '24/7'}
              label={stats.capacityM3 > 0 ? 'de capacidad en la red' : 'acceso a tu espacio'}
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
            cta="Buscar bodega"
            href="/registro"
          />
          <PathCard
            eyebrow="Quiero ser bodeguero"
            icon="espacios"
            title="Tengo espacio y quiero rentabilizarlo"
            body="Convierte tu bodega o local en una microbodega BodGo: recibe mercancía, prepara pedidos y genera ingresos con lo que ya tienes."
            cta="Empezar a ganar"
            href="/registro?rol=bodeguero"
            dark
          />
        </div>
      </section>

      {/* ------------------------------------------------------- para pymes */}
      <section id="para-pymes" className="scroll-mt-16 border-y border-line-100 bg-surface-50 py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="text-eyebrow">Para PyMEs</p>
            <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
              Entrega más rápido y crece sin infraestructura propia
            </h2>

            <ul className="mt-9 space-y-7">
              {[
                {
                  n: '01',
                  t: 'Entrega más rápido',
                  d: 'Acerca tu inventario a tus clientes con una red de microbodegas repartidas por la ciudad.',
                },
                {
                  n: '02',
                  t: 'Simplifica tu operación',
                  d: 'Inventario, picking y despachos en una sola plataforma, sin importar en cuántas bodegas tengas stock.',
                },
                {
                  n: '03',
                  t: 'Escala a tu ritmo',
                  d: 'Paga sólo por el espacio y el tiempo que necesitas. Sin arriendo largo ni personal fijo.',
                },
              ].map((item) => (
                <li key={item.n} className="flex gap-4">
                  <span className="text-[12px] font-extrabold text-brand-600 pt-1">{item.n}</span>
                  <div>
                    <h3 className="text-[17px] font-extrabold tracking-tight text-navy-900">
                      {item.t}
                    </h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-500">{item.d}</p>
                  </div>
                </li>
              ))}
            </ul>
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

      {/* --------------------------------------------------- cómo funciona */}
      <section id="como-funciona" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
          <p className="text-eyebrow">En 3 pasos</p>
          <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[38px]">
            Cómo funciona
          </h2>

          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                t: 'Contrata una microbodega',
                d: 'Elige un espacio cerca de tu demanda y paga por mes. Tu pago queda en custodia hasta que confirmes que todo llegó bien.',
              },
              {
                t: 'Envía y administra tu stock',
                d: 'Despachas tu mercadería con un manifiesto de SKUs. El bodeguero cuenta contra esa lista y confirma la recepción con foto.',
              },
              {
                t: 'Decide desde dónde despachar',
                d: 'Cuando vendes, el bodeguero prepara el pedido y sale desde el punto más cercano al comprador, con seguimiento para él.',
              },
            ].map((step, i) => (
              <li key={step.t} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-800 text-[15px] font-extrabold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-[18px] font-extrabold tracking-tight text-navy-900">
                  {step.t}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------- confianza */}
      <Trust />

      {/* ------------------------------------------------- para bodegueros */}
      <section id="para-bodegueros" className="scroll-mt-16 bg-navy-800 py-20 text-white md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-[20px] lg:order-1">
            <Image
              src="/fotos/bodeguero-espacio.jpg"
              alt="Una bodeguera ordenando mercadería en su microbodega"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">
              Para bodegueros
            </p>
            <h2 className="mt-4 text-[30px] font-extrabold leading-tight tracking-[-0.02em] md:text-[38px]">
              Convierte espacio disponible en nuevos ingresos
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-white/65">
              Únete a la red y conecta tu bodega con empresas que necesitan almacenar más cerca de
              sus clientes. Sin costo de inscripción y con pago garantizado a fin de mes.
            </p>

            <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-white/10">
              <HostStat value={formatCompactCLP(640_000)} label="ingreso mensual promedio" />
              <HostStat value="14–27 m³" label="por microbodega" />
              <HostStat value={`${Math.round(HOST_COMMISSION_RATE * 100)}%`} label="comisión BodGo" />
              <HostStat value="Fin de mes" label="pago garantizado" />
            </dl>

            <ButtonLink
              href="/registro?rol=bodeguero"
              size="lg"
              variant="secondary"
              className="mt-8 border-transparent bg-white text-navy-800 hover:bg-white/90"
            >
              Quiero ser bodeguero
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- precios */}
      <section id="precios" className="scroll-mt-16 bg-navy-950 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">Precios</p>
          <h2 className="mt-4 max-w-2xl text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-white md:text-[38px]">
            Paga sólo por el espacio que necesitas
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
            Arriendo mensual, con la comisión de plataforma ya incluida en lo que ves.
          </p>

          <div className="mt-12">
            <PricingCalculator />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ faq */}
      <section id="preguntas" className="scroll-mt-16 mx-auto max-w-6xl px-5 py-20 md:py-24">
        <p className="text-eyebrow text-center">Preguntas frecuentes</p>
        <h2 className="mt-3 text-center text-[30px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[38px]">
          Todo lo que necesitas saber
        </h2>

        <div className="mt-12">
          <Faq />
        </div>

        <p className="mt-10 text-center text-[14px] text-ink-500">
          ¿Tienes otra pregunta? Escríbenos a{' '}
          <a href="mailto:hola@bodgo.cl" className="font-bold text-brand-600 hover:underline">
            hola@bodgo.cl
          </a>
        </p>
      </section>

      {/* ----------------------------------------------------- cta final */}
      <section className="border-t border-line-100 bg-surface-50 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
            Lleva tu e-commerce más cerca de tus clientes
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15.5px] text-ink-500">
            Encuentra tu primera microbodega en minutos. Crear la cuenta es gratis y sin
            compromiso.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/registro" size="lg">
              Empieza gratis
            </ButtonLink>
            <ButtonLink href="/registro?rol=bodeguero" size="lg" variant="secondary">
              Publicar mi espacio
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[22px] font-extrabold leading-none text-white tabular-nums sm:text-[30px]">
          {value}
        </span>
        <span className="mt-1.5 block text-[11.5px] leading-snug text-white/55 sm:text-[12px]">
          {label}
        </span>
      </dd>
    </div>
  );
}

function HostStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-navy-800 p-5">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[21px] font-extrabold leading-none">{value}</span>
        <span className="mt-2 block text-[12px] text-white/50">{label}</span>
      </dd>
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
      <p className={`mt-3 flex-1 text-[14.5px] leading-relaxed ${dark ? 'text-white/60' : 'text-ink-500'}`}>
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
