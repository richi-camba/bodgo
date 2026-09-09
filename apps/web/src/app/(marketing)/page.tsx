import { ButtonLink } from '@/components/ui/button';
import { Faq } from '@/components/marketing/faq';
import { PricingCalculator } from '@/components/marketing/pricing-calculator';
import { createClient } from '@/lib/supabase/server';
import { formatCompactCLP, HOST_COMMISSION_RATE, INSURANCE_COVERAGE_CLP } from '@bodgo/core';

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
    .select('comuna, available_m2, price_per_m2');

  if (error || !data) return { warehouses: 0, comunas: 0, availableM2: 0 };

  return {
    warehouses: data.length,
    comunas: new Set(data.map((w) => w.comuna)).size,
    availableM2: Math.round(data.reduce((sum, w) => sum + Number(w.available_m2 ?? 0), 0)),
  };
}

export default async function HomePage() {
  const stats = await loadNetworkStats();

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-600/25 blur-[120px]"
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-20 md:pb-28 md:pt-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">
            Chile · Red de microbodegas urbanas
          </p>
          <h1 className="mt-5 max-w-3xl text-[42px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white md:text-[62px]">
            Tu inventario, más cerca de tus clientes
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/65 md:text-[17px]">
            Guarda tu stock en microbodegas urbanas cerca de tu demanda. Gestiona inventario, picking
            y despachos desde una sola plataforma, y paga sólo por el espacio y el tiempo que
            necesitas.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/registro" size="lg">
              Empieza gratis
            </ButtonLink>
            <ButtonLink
              href="#como-funciona"
              size="lg"
              variant="secondary"
              className="border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/15"
            >
              Cómo funciona
            </ButtonLink>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
            <HeroStat
              value={stats.warehouses > 0 ? String(stats.warehouses) : '—'}
              label={stats.warehouses === 1 ? 'bodega activa' : 'bodegas activas'}
            />
            <HeroStat
              value={stats.comunas > 0 ? String(stats.comunas) : '—'}
              label={stats.comunas === 1 ? 'comuna cubierta' : 'comunas cubiertas'}
            />
            <HeroStat value="24/7" label="acceso a tu espacio" />
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------ dos caminos */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <p className="text-eyebrow">Dos formas de empezar</p>
        <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[38px]">
          ¿Con cuál te identificas?
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <PathCard
            eyebrow="Tengo una PyME"
            title="Vendo online y necesito espacio"
            body="Guarda tu stock cerca de tus clientes y despacha más rápido, sin arrendar una bodega completa ni contratar personal."
            cta="Buscar bodega"
            href="/buscar"
          />
          <PathCard
            eyebrow="Quiero ser bodeguero"
            title="Tengo espacio y quiero rentabilizarlo"
            body="Convierte tu bodega o local en una microbodega BodGo: recibe mercancía, prepara pedidos y genera ingresos con lo que ya tienes."
            cta="Empezar a ganar"
            href="/registro?rol=bodeguero"
            dark
          />
        </div>
      </section>

      {/* --------------------------------------------------------- por qué */}
      <section id="para-pymes" className="border-y border-line-100 bg-surface-50 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-eyebrow">Por qué BodGo</p>
          <h2 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
            Entrega más rápido, simplifica tu operación y crece sin infraestructura propia
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Entrega más rápido',
                d: 'Acerca tu inventario a tus clientes con una red de microbodegas urbanas repartidas por la ciudad.',
              },
              {
                n: '02',
                t: 'Simplifica tu operación',
                d: 'Inventario, picking y despachos en una sola plataforma, sin importar en cuántas bodegas tengas stock.',
              },
              {
                n: '03',
                t: 'Escala a tu ritmo',
                d: 'Paga sólo por el espacio y el tiempo que necesitas. Sin arriendo largo ni infraestructura propia.',
              },
            ].map((item) => (
              <div key={item.n} className="card p-7">
                <span className="text-[13px] font-extrabold text-brand-600">{item.n}</span>
                <h3 className="mt-4 text-[18px] font-extrabold tracking-tight text-navy-900">{item.t}</h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20 md:py-24">
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
              d: 'Cuando vendes, el bodeguero prepara el pedido y sale desde el punto más cercano al comprador.',
            },
          ].map((step, i) => (
            <li key={step.t} className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-[14px] font-extrabold text-white">
                {i + 1}
              </span>
              <h3 className="mt-5 text-[18px] font-extrabold tracking-tight text-navy-900">{step.t}</h3>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-500">{step.d}</p>
            </li>
          ))}
        </ol>

        <p className="mt-12 rounded-card border border-brand-100 bg-brand-50 p-6 text-[14px] leading-relaxed text-navy-800">
          <strong className="font-extrabold">El pago queda en custodia.</strong> A ti se te cobra por
          adelantado al contratar, pero al bodeguero recién se le paga a fin de mes por los días
          efectivamente usados. Si algo no llega como lo declaraste, la plata sigue retenida mientras
          se resuelve la diferencia.
        </p>
      </section>

      {/* ------------------------------------------------- para bodegueros */}
      <section id="para-bodegueros" className="bg-navy-800 py-20 text-white md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">
              Para bodegueros
            </p>
            <h2 className="mt-4 max-w-lg text-[30px] font-extrabold leading-tight tracking-[-0.02em] md:text-[38px]">
              Convierte espacio disponible en nuevos ingresos
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-white/65">
              Únete a la red BodGo y conecta tu bodega con empresas que necesitan almacenar más cerca
              de sus clientes. Sin costo de inscripción y con pago garantizado a fin de mes.
            </p>
            <ButtonLink
              href="/registro?rol=bodeguero"
              size="lg"
              variant="secondary"
              className="mt-8 border-transparent bg-white text-navy-800 hover:bg-white/90"
            >
              Quiero ser bodeguero
            </ButtonLink>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-white/10">
            <HostStat value={formatCompactCLP(640_000)} label="ingreso mensual promedio" />
            <HostStat value="14–27 m³" label="por microbodega" />
            <HostStat value={`${Math.round(HOST_COMMISSION_RATE * 100)}%`} label="comisión BodGo" />
            <HostStat value="Fin de mes" label="pago garantizado" />
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------- precios */}
      <section id="precios" className="bg-navy-950 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">Precios</p>
          <h2 className="mt-4 max-w-2xl text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-white md:text-[38px]">
            Paga sólo por el espacio que necesitas
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/60">
            Arriendo mensual, con una comisión de plataforma del 8% incluida en cada operación.
          </p>

          <div className="mt-12">
            <PricingCalculator />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- faq */}
      <section id="preguntas" className="mx-auto max-w-6xl px-5 py-20 md:py-24">
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
            Encuentra tu primera microbodega en minutos. Seguro de contenido incluido hasta{' '}
            {formatCompactCLP(INSURANCE_COVERAGE_CLP)} por PyME.
          </p>
          <ButtonLink href="/registro" size="lg" className="mt-8">
            Empieza gratis
          </ButtonLink>
        </div>
      </section>

      {/* ------------------------------------------------------ patrocinio */}
      <section className="border-t border-line-100 bg-white py-12">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="text-eyebrow">Proyecto apoyado por</p>
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-500">
            Iniciativa financiada por <strong className="font-bold text-navy-800">Corfo</strong> a
            través del instrumento Semilla Inicia (25INI2-312540), con el patrocinio de{' '}
            <strong className="font-bold text-navy-800">Innovo</strong>.
          </p>
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
        <span className="block text-[30px] font-extrabold leading-none text-white tabular-nums">
          {value}
        </span>
        <span className="mt-1.5 block text-[12.5px] text-white/50">{label}</span>
      </dd>
    </div>
  );
}

function HostStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-navy-800 p-6">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[24px] font-extrabold leading-none">{value}</span>
        <span className="mt-2 block text-[12.5px] text-white/50">{label}</span>
      </dd>
    </div>
  );
}

function PathCard({
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
    <div
      className={`flex flex-col rounded-[20px] p-8 ${
        dark ? 'bg-navy-800 text-white' : 'card'
      }`}
    >
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.1em] ${
          dark ? 'text-brand-400' : 'text-brand-600'
        }`}
      >
        {eyebrow}
      </p>
      <h3
        className={`mt-4 text-[21px] font-extrabold leading-tight tracking-tight ${
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
