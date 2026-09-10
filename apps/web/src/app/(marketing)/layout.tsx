import { SiteFooter, SiteHeader } from '@/components/marketing/site-chrome';

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

      <SiteHeader />
      <main id="contenido">{children}</main>
      <SiteFooter />
    </div>
  );
}
