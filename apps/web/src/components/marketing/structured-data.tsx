import { INSURANCE_COVERAGE_CLP } from '@bodgo/core';
import type { Pregunta } from './faq-content';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodgo.vercel.app';

/** La ficha de la empresa. Va sólo en la portada, para no repetirla. */
export function OrganizationSchema() {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'BodGo',
      legalName: 'Tamayaz SpA',
      url: site,
      logo: `${site}/opengraph-image`,
      description:
        'Red de microbodegas urbanas para el e-commerce de las PyMEs chilenas. Arrienda los metros que necesitas cerca de tu demanda y despacha desde ahí.',
      areaServed: { '@type': 'City', name: 'Santiago', addressCountry: 'CL' },
      email: 'hola@bodgo.cl',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Arriendo de microbodegas urbanas',
      provider: { '@type': 'Organization', name: 'BodGo' },
      areaServed: { '@type': 'City', name: 'Santiago', addressCountry: 'CL' },
      description: `Arriendo mensual de microbodegas de 8 a 15 m² con pago en custodia y seguro de contenido hasta ${INSURANCE_COVERAGE_CLP} pesos.`,
    },
  ];

  return <Ld data={data} />;
}

/**
 * Las preguntas de la página, para que el buscador pueda mostrarlas.
 * Cada página declara las suyas: repetir el mismo FAQPage en tres URLs le
 * dice a Google que dos de ellas son duplicados.
 */
export function FaqSchema({ preguntas }: { preguntas: Pregunta[] }) {
  return (
    <Ld
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: preguntas.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }}
    />
  );
}

function Ld({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // El contenido es nuestro y estático; no viene de entrada del usuario.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
