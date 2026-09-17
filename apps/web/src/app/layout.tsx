import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodgo.cl';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BodGo · Red de microbodegas urbanas',
    template: '%s · BodGo',
  },
  // La portada absorbió precios y «para bodegueros», así que cubre las tres
  // intenciones de búsqueda: guardar stock, cuánto cuesta y arrendar un
  // espacio propio.
  description:
    'Guarda tu stock en microbodegas urbanas cerca de tus clientes y despacha más rápido. Arriendo mensual por m², con comisión del 8% incluida, pago en custodia y seguro de contenido. ¿Tienes una bodega vacía? Arriéndala y genera ingresos.',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'BodGo',
    title: 'BodGo · Red de microbodegas urbanas',
    description:
      'Guarda tu stock en microbodegas urbanas cerca de tu demanda y despacha más rápido, sin bodega propia.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BodGo · Red de microbodegas urbanas',
    description: 'Tu inventario, más cerca de tus clientes.',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#16365A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
