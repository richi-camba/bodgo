import { INSURANCE_COVERAGE_CLP } from '@bodgo/core';
import { FAQ } from './faq-content';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodgo.vercel.app';

/**
 * Datos estructurados para buscadores y asistentes.
 *
 * Las preguntas salen del mismo archivo que alimenta el acordeón, para que
 * Google no termine mostrando una respuesta que la página ya no dice.
 */
export function StructuredData() {
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
      sameAs: [] as string[],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Arriendo de microbodegas urbanas',
      provider: { '@type': 'Organization', name: 'BodGo' },
      areaServed: { '@type': 'City', name: 'Santiago', addressCountry: 'CL' },
      description: `Arriendo mensual de microbodegas de 8 a 15 m² con pago en custodia y seguro de contenido hasta ${INSURANCE_COVERAGE_CLP} pesos.`,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'CLP',
        lowPrice: 30000,
        highPrice: 58000,
        // El precio se expresa por m² al mes, que es como se contrata.
        description: 'Precio por metro cuadrado al mes, con 8% de comisión de plataforma incluido.',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // El contenido es nuestro y estático; no viene de entrada del usuario.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
