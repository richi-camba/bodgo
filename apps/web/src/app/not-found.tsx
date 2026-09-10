import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { SiteFooter, SiteHeader } from '@/components/marketing/site-chrome';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: true },
};

const SALIDAS = [
  { href: '/bodegas', label: 'Ver microbodegas', detalle: 'Espacios disponibles hoy en Santiago' },
  { href: '/precios', label: 'Precios', detalle: 'Cuánto cuesta y qué incluye' },
  { href: '/para-bodegueros', label: 'Arrendar mi espacio', detalle: 'Si tienes una bodega vacía' },
];

/**
 * 404 global.
 *
 * Queda fuera del grupo de rutas de marketing, así que trae su propia cabecera
 * y pie: una pantalla sin navegación deja al visitante sin salida más que el
 * botón de atrás.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-20">
        <p className="text-eyebrow">Error 404</p>
        <h1 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.025em] text-navy-900 md:text-[42px]">
          Esta página no existe
        </h1>
        <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-ink-500">
          Puede que el enlace esté mal escrito o que apunte a algo que ya no está. Estas son las
          páginas a las que suele llegar la gente:
        </p>

        <ul className="mt-8 space-y-2.5">
          {SALIDAS.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold text-navy-900">{s.label}</p>
                  <p className="mt-0.5 text-[13px] text-ink-500">{s.detalle}</p>
                </div>
                <Icon name="siguiente" size={18} className="text-ink-400" />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <ButtonLink href="/" variant="secondary">
            Volver al inicio
          </ButtonLink>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
