import type { MetadataRoute } from 'next';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodgo.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Las apps internas y el seguimiento del comprador no tienen nada que
      // hacer en un buscador: una lleva sesión y el otro es un enlace privado.
      disallow: ['/app/', '/bodeguero/', '/admin/', '/seguimiento/', '/auth/'],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
