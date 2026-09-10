import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';
import { MobileMenu } from '@/components/marketing/mobile-menu';

const NAV = [
  { href: '/bodegas', label: 'Microbodegas' },
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/#para-bodegueros', label: 'Para bodegueros' },
  { href: '/#precios', label: 'Precios' },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Salto directo al contenido para quien navega con teclado. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-field focus:bg-navy-800 focus:px-4 focus:py-2.5 focus:text-[13px] focus:font-bold focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-50 border-b border-line-100/70 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
          <Link href="/" aria-label="BodGo, ir al inicio">
            <Logo size={22} />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[13.5px] font-semibold text-ink-700 transition-colors hover:text-navy-800"
              >
                {item.label}
              </a>
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
            <MobileMenu links={NAV} />
          </div>
        </div>
      </header>

      <main id="contenido">{children}</main>

      <footer className="bg-navy-950 text-white">
        {/* ----------------------------------------------------- patrocinio */}
        <div className="border-b border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-10 text-center sm:flex-row sm:justify-center sm:gap-8 sm:text-left">
            {/* Sobre chip blanco y en sus colores: el logo de un organismo
                público no se recolorea para que combine con el sitio. */}
            <span className="flex shrink-0 items-center justify-center rounded-[10px] bg-white px-4 py-3">
              <Image src="/marcas/corfo.png" alt="Corfo" width={104} height={35} />
            </span>
            <p className="max-w-md text-[12.5px] leading-relaxed text-white/50">
              Iniciativa financiada por <strong className="font-semibold text-white/75">Corfo</strong>{' '}
              a través del instrumento Semilla Inicia (25INI2-312540), con el patrocinio de{' '}
              <strong className="font-semibold text-white/75">Innovo</strong>.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <Logo size={22} tone="light" />
              <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/60">
                Red de microbodegas urbanas modulares para el e-commerce de las PyMEs.
              </p>
              <p className="mt-5 text-[11px] font-semibold tracking-wide text-white/35">
                TAMAYAZ SpA · Santiago, Chile
              </p>
            </div>

            <FooterColumn
              title="Plataforma"
              links={[
                { href: '/bodegas', label: 'Ver microbodegas' },
                { href: '/registro', label: 'Crear cuenta' },
                { href: '/registro?rol=bodeguero', label: 'Ser bodeguero' },
                { href: '/ingresar', label: 'Ingresar' },
              ]}
            />
            <FooterColumn
              title="Producto"
              links={[
                { href: '/#como-funciona', label: 'Cómo funciona' },
                { href: '/#precios', label: 'Precios' },
                { href: '/#preguntas', label: 'Preguntas frecuentes' },
                { href: '/#contacto', label: 'Contacto' },
              ]}
            />
            <FooterColumn
              title="Contacto"
              links={[
                { href: 'mailto:hola@bodgo.cl', label: 'hola@bodgo.cl' },
                { href: 'mailto:ayuda@bodgo.cl', label: 'ayuda@bodgo.cl' },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} BodGo · Todos los derechos reservados</p>
            <p>
              <Link href="/terminos" className="hover:text-white/80">
                Términos
              </Link>
              <span className="px-2">·</span>
              <Link href="/privacidad" className="hover:text-white/80">
                Privacidad (Ley 19.628)
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/40">{title}</h3>
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
