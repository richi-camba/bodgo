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
  description:
    'Acerca tu inventario a tus clientes con una red de microbodegas urbanas. Gestiona inventario, picking y despachos desde una sola plataforma y paga sólo por el espacio y el tiempo que necesitas.',
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
