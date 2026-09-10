import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodgo.vercel.app';

export const revalidate = 3600;

/**
 * El mapa del sitio incluye la ficha de cada microbodega publicada: son las
 * páginas por las que alguien podría buscar «bodega en Ñuñoa».
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from('warehouse_listings')
    .select('id, comuna, published_at');

  const comunas = [...new Set((listings ?? []).map((w) => w.comuna).filter(Boolean))] as string[];

  return [
    { url: site, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site}/bodegas`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site}/precios`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site}/para-bodegueros`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${site}/registro`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    ...comunas.map((c) => ({
      url: `${site}/bodegas?comuna=${encodeURIComponent(c)}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...(listings ?? []).map((w) => ({
      url: `${site}/bodegas/${w.id}`,
      lastModified: w.published_at ? new Date(w.published_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    { url: `${site}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${site}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${site}/ingresar`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
