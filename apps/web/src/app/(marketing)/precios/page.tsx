import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Faq } from '@/components/marketing/faq';
import { preguntasDe } from '@/components/marketing/faq-content';
import { FaqSchema } from '@/components/marketing/structured-data';
import { PricingCalculator } from '@/components/marketing/pricing-calculator';
import { createClient } from '@/lib/supabase/server';
import {
  formatCLP,
  formatNumber,
  HOST_COMMISSION_RATE,
  INSURANCE_COVERAGE_CLP,
  PLATFORM_COMMISSION_RATE,
  quoteContract,
  usableCapacityM3,
} from '@bodgo/core';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Precios de microbodegas en Santiago',
  description:
    'Cuánto cuesta arrendar una microbodega urbana: precio por m² al mes, comisión de plataforma del 8% incluida, pago en custodia y seguro de contenido. Calcula tu arriendo.',
  alternates: { canonical: '/precios' },
};

/** Qué incluye el precio y qué no. Sin letra chica escondida. */
const INCLUIDO: { icon: IconName; label: string }[] = [
  { icon: 'pagos', label: 'Pago en custodia hasta confirmar la recepción' },
  { icon: 'seguro', label: 'Seguro de contenido por robo e incendio' },
  { icon: 'recepciones', label: 'Recepción contada y fotografiada contra tu manifiesto' },
  { icon: 'inventario', label: 'Inventario multibodega en tiempo real' },
  { icon: 'pedidos', label: 'Picking y packing del bodeguero' },
  { icon: 'envios', label: 'Seguimiento del pedido para tu comprador' },
];

const NO_INCLUIDO = [
  'El despacho al comprador final: lo cobras tú y lo paga el courier que elijas.',
  'El traslado de tu mercadería hasta la bodega.',
  'Embalaje y etiquetas.',
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from('warehouse_listings')
    .select('price_per_m2, total_m2, comuna');

  const precios = (listings ?? []).map((w) => w.price_per_m2 ?? 0).filter(Boolean);
  const minimo = precios.length ? Math.min(...precios) : null;
  const maximo = precios.length ? Math.max(...precios) : null;
  const promedio = precios.length
    ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length)
    : null;

  const preguntas = preguntasDe('precios', 'general');

  return (
    <>
      <FaqSchema preguntas={preguntas} />

      <section className="border-b border-line-100 bg-navy-950 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">Precios</p>
          <h1 className="mt-4 max-w-2xl text-[34px] font-extrabold leading-[1.08] tracking-[-0.025em] text-white md:text-[46px]">
            Paga sólo por el espacio y el tiempo que necesitas
          </h1>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">
            Se arrienda por metro cuadrado y por mes, sin plazo mínimo ni costo de instalación. La
            comisión de plataforma del {Math.round(PLATFORM_COMMISSION_RATE * 100)}% ya viene
            incluida en el precio que ves.
          </p>

          {minimo && maximo ? (
            <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/15 pt-8 sm:gap-8">
              <HeroStat value={formatCLP(minimo)} label="el m² más barato de la red" />
              <HeroStat value={formatCLP(promedio!)} label="promedio por m² al mes" />
              <HeroStat value={formatCLP(maximo)} label="el m² más caro" />
            </dl>
          ) : null}
        </div>
      </section>

      {/* ------------------------------------------------------ calculadora */}
      <section className="bg-navy-950 pb-20 md:pb-24">
        <div className="mx-auto max-w-6xl px-5">
          <PricingCalculator />
        </div>
      </section>

      {/* -------------------------------------------------------- ejemplos */}
      <section className="border-b border-line-100 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-eyebrow">Tres casos concretos</p>
          <h2 className="mt-3 max-w-2xl text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
            Cuánto paga una PyME de verdad
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-500">
            Calculado sobre {formatCLP(promedio ?? 42_000)} por m² al mes, el promedio real de la
            red hoy.
          </p>

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { m2: 2, quien: 'Vendes accesorios o ropa', detalle: 'Unos 400 productos chicos' },
              { m2: 6, quien: 'Vendes calzado o decoración', detalle: 'Cerca de 5 pallets' },
              { m2: 12, quien: 'Despachas más de 100 pedidos al mes', detalle: 'Una microbodega completa' },
            ].map((caso) => {
              const q = quoteContract(caso.m2, promedio ?? 42_000);
              return (
                <li key={caso.m2} className="card flex flex-col p-6">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-brand-600">
                    {caso.m2} m²
                  </p>
                  <h3 className="mt-2 text-[17px] font-extrabold tracking-tight text-navy-900">
                    {caso.quien}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-ink-500">
                    {caso.detalle} · {formatNumber(usableCapacityM3(caso.m2), 1)} m³ apilables
                  </p>

                  <dl className="mt-5 space-y-2 border-t border-line-100 pt-4 text-[13px]">
                    <Row label="Arriendo" value={formatCLP(q.base)} />
                    <Row label="Comisión (8%)" value={formatCLP(q.commission)} />
                  </dl>

                  <p className="mt-auto pt-5">
                    <span className="block text-[24px] font-extrabold leading-none text-navy-900 tabular-nums">
                      {formatCLP(q.total)}
                    </span>
                    <span className="mt-1 block text-[12px] text-ink-500">al mes, todo incluido</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------- qué incluye */}
      <section className="border-b border-line-100 bg-surface-50 py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="text-eyebrow">Qué incluye</p>
            <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[32px]">
              Todo esto va en el precio
            </h2>

            <ul className="mt-8 space-y-4">
              {INCLUIDO.map((item) => (
                <li key={item.label} className="flex gap-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field bg-success-50 text-success-700">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <span className="pt-1 text-[14.5px] leading-relaxed text-ink-700">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-eyebrow">Qué no incluye</p>
            <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[32px]">
              Y esto lo pagas aparte
            </h2>

            <ul className="mt-8 space-y-4">
              {NO_INCLUIDO.map((item) => (
                <li key={item} className="flex gap-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field bg-surface-100 text-ink-500">
                    <Icon name="cerrar" size={15} />
                  </span>
                  <span className="pt-1 text-[14.5px] leading-relaxed text-ink-700">{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-8 rounded-card border border-line-200 bg-white p-5 text-[13.5px] leading-relaxed text-ink-700">
              El seguro de la red cubre robo e incendio hasta{' '}
              <strong className="font-bold text-navy-900">
                {formatCLP(INSURANCE_COVERAGE_CLP)}
              </strong>{' '}
              por PyME, sin costo adicional. Las exclusiones están en los{' '}
              <a href="/terminos" className="font-bold text-brand-600 hover:underline">
                términos
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- cómo se reparte */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-5">
          <p className="text-eyebrow">Sin sorpresas</p>
          <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[38px]">
            A dónde va cada peso
          </h2>

          <ol className="mt-10 space-y-6">
            {[
              {
                t: 'Pagas por adelantado',
                d: `El arriendo más el ${Math.round(PLATFORM_COMMISSION_RATE * 100)}% de comisión. El monto no se le entrega a nadie todavía: queda retenido por BodGo.`,
              },
              {
                t: 'El bodeguero recibe tu mercadería',
                d: 'Cuenta producto por producto contra tu manifiesto y lo fotografía. Si algo no calza, el pago sigue retenido mientras se resuelve.',
              },
              {
                t: 'Recién ahí se libera',
                d: `Al bodeguero se le liquida a fin de mes, neto del ${Math.round(HOST_COMMISSION_RATE * 100)}% que retiene BodGo por operar la red.`,
              },
              {
                t: 'Si te vas antes, se prorratea',
                d: 'Sobre un mes de 30 días. El bodeguero cobra los días usados y el resto vuelve a tu tarjeta en 3 a 5 días hábiles.',
              },
            ].map((paso, i) => (
              <li key={paso.t} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-800 text-[14px] font-extrabold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[17px] font-extrabold tracking-tight text-navy-900">{paso.t}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-500">{paso.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------- preguntas */}
      <section className="border-t border-line-100 bg-surface-50 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-eyebrow text-center">Preguntas sobre el precio</p>
          <h2 className="mt-3 text-center text-[28px] font-extrabold tracking-[-0.02em] text-navy-900 md:text-[34px]">
            Lo que conviene saber antes de contratar
          </h2>
          <div className="mt-12">
            <Faq preguntas={preguntas} />
          </div>
        </div>
      </section>

      <section className="border-t border-line-100 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900 md:text-[34px]">
            Mira los precios reales de cada bodega
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-500">
            Cada microbodega fija su propio precio por m². Puedes verlos todos sin crear cuenta.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/bodegas" size="lg">
              Ver microbodegas
            </ButtonLink>
            <ButtonLink href="/registro" size="lg" variant="secondary">
              Crear cuenta gratis
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
        <span className="block text-[22px] font-extrabold leading-none text-white tabular-nums sm:text-[28px]">
          {value}
        </span>
        <span className="mt-1.5 block text-[11.5px] leading-snug text-white/70 sm:text-[12px]">
          {label}
        </span>
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-bold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
