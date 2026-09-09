import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';

const NAV = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#para-pymes', label: 'Para PyMEs' },
  { href: '#para-bodegueros', label: 'Para bodegueros' },
  { href: '#precios', label: 'Precios' },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
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
            <ButtonLink href="/ingresar" variant="ghost" size="sm">
              Ingresar
            </ButtonLink>
            <ButtonLink href="/registro" size="sm">
              Empieza gratis
            </ButtonLink>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-line-100 bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <Logo size={22} tone="light" />
              <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/60">
                Red de microbodegas urbanas modulares para el e-commerce de las PyMEs.
              </p>
              <p className="mt-5 text-[11px] font-semibold tracking-wide text-white/35">
                TAMAYAZ SpA · Corfo Semilla Inicia 25INI2-312540
              </p>
            </div>

            <FooterColumn
              title="Plataforma"
              links={[
                { href: '/buscar', label: 'Buscar bodega' },
                { href: '/registro?rol=bodeguero', label: 'Ser bodeguero' },
                { href: '/ingresar', label: 'Ingresar' },
              ]}
            />
            <FooterColumn
              title="Producto"
              links={[
                { href: '#como-funciona', label: 'Cómo funciona' },
                { href: '#precios', label: 'Precios' },
                { href: '#preguntas', label: 'Preguntas frecuentes' },
              ]}
            />
            <FooterColumn
              title="Contacto"
              links={[
                { href: 'mailto:hola@bodgo.cl', label: 'hola@bodgo.cl' },
                { href: '#', label: 'Santiago, Chile' },
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
