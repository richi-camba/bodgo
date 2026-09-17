import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';
import { MobileMenu } from '@/components/marketing/mobile-menu';

/**
 * Cabecera y pie del sitio público.
 *
 * Viven acá y no dentro del layout porque la página de «no encontrado» global
 * queda fuera del grupo de rutas de marketing: sin esto, alguien que erra una
 * URL aterriza en una pantalla sin salida.
 */
export const SITE_NAV = [
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/bodegas', label: 'Para PyMEs' },
  { href: '/#bodegueros', label: 'Para bodegueros' },
  { href: '/#precios', label: 'Precios' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line-100/70 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Link href="/" aria-label="BodGo, ir al inicio">
          <Logo size={22} />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
          {SITE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13.5px] font-semibold text-ink-700 transition-colors hover:text-navy-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <ButtonLink href="/ingresar" variant="ghost" size="sm">
              Ingresar
            </ButtonLink>
            <ButtonLink href="/registro" size="sm">
              Empieza gratis
            </ButtonLink>
          </div>
          <MobileMenu links={SITE_NAV} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-white">
      {/* Los dos logos van sobre blanco y en sus colores: la marca de un
          organismo público no se recolorea ni se pone en negativo. */}
      <div className="bg-white px-5 py-[clamp(36px,5vw,48px)] text-navy-900">
        <div className="mx-auto max-w-[1000px] text-center">
          <p className="text-[12px] font-bold tracking-[0.1em] text-ink-400">PROYECTO APOYADO POR</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-[clamp(28px,6vw,64px)]">
            <Image src="/marcas/corfo.png" alt="Corfo" width={154} height={52} className="h-[52px] w-auto object-contain" />
            <span aria-hidden className="hidden h-[46px] w-px bg-line-200 sm:block" />
            <Image src="/marcas/innovo.png" alt="Innovo" width={190} height={64} className="h-16 w-auto object-contain" />
          </div>
          <p className="mx-auto mt-[22px] max-w-[620px] text-[12px] leading-relaxed text-ink-400">
            Iniciativa financiada por <strong className="font-semibold text-ink-700">Corfo</strong> a
            través del instrumento Semilla Inicia (25INI2-312540), con el patrocinio de{' '}
            <strong className="font-semibold text-ink-700">Innovo</strong>.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo size={22} tone="light" />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/70">
              Red de microbodegas urbanas modulares para el e-commerce de las PyMEs.
            </p>
            <p className="mt-5 text-[11px] font-semibold tracking-wide text-white/60">
              TAMAYAZ SpA · Santiago, Chile
            </p>
          </div>

          <FooterColumn
            title="Plataforma"
            links={[
              { href: '/bodegas', label: 'Ver microbodegas' },
              { href: '/#precios', label: 'Precios' },
              { href: '/registro', label: 'Crear cuenta' },
              { href: '/ingresar', label: 'Ingresar' },
            ]}
          />
          <FooterColumn
            title="Producto"
            links={[
              { href: '/#como-funciona', label: 'Cómo funciona' },
              { href: '/#bodegueros', label: 'Para bodegueros' },
              { href: '/#preguntas', label: 'Preguntas frecuentes' },
              { href: '/#contacto', label: 'Contacto' },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { href: '/terminos', label: 'Términos' },
              { href: '/privacidad', label: 'Privacidad' },
              { href: 'mailto:hola@bodgo.cl', label: 'hola@bodgo.cl' },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BodGo · Todos los derechos reservados</p>
          <p>Ley 19.628 sobre protección de la vida privada</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-[13.5px] text-white/70 transition-colors hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
