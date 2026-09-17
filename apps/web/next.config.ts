import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Los paquetes del workspace se publican como TypeScript sin compilar.
  transpilePackages: ['@bodgo/core', '@bodgo/db'],
  /**
   * Precios y «para bodegueros» dejaron de ser páginas: su contenido vive en
   * la portada, como en el prototipo. Estaban indexadas y enlazadas desde
   * fuera, así que el 308 las manda a su sección en vez de dar un 404.
   */
  async redirects() {
    return [
      { source: '/precios', destination: '/#precios', permanent: true },
      { source: '/para-bodegueros', destination: '/#bodegueros', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default config;
