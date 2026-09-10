import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Icon, type IconName } from '@/components/ui/icon';
import { NavLink } from './nav-link';
import { SignOutButton } from './sign-out-button';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Sólo los ítems marcados aparecen en la barra inferior del móvil. */
  primary?: boolean;
};

type Props = {
  nav: NavItem[];
  /** Etiqueta del rol junto al logo: "PyME", "Bodeguero", "Admin". */
  roleLabel: string;
  userName: string;
  userSubtitle?: string;
  initials: string;
  /** Navy en el backoffice, claro en las apps de PyME y bodeguero. */
  tono?: 'claro' | 'navy';
  /** Ruta y cantidad de avisos sin leer, para la campana. */
  avisos?: { href: string; sinLeer: number };
  children: React.ReactNode;
};

/**
 * Armazón de las tres apps internas.
 *
 * En escritorio es una barra lateral fija; en móvil, una barra inferior con
 * los accesos principales, como en el prototipo. La misma página sirve a
 * ambos: no hay dos árboles de rutas que mantener sincronizados.
 */
export function AppShell({
  nav,
  roleLabel,
  userName,
  userSubtitle,
  initials,
  tono = 'claro',
  avisos,
  children,
}: Props) {
  const primary = nav.filter((item) => item.primary);
  const navy = tono === 'navy';

  return (
    <div className="min-h-screen bg-surface-50 lg:flex">
      {/* ------------------------------------------------ barra lateral */}
      <aside
        className={`hidden w-60 shrink-0 flex-col lg:fixed lg:inset-y-0 lg:flex ${
          navy ? 'bg-navy-950' : 'border-r border-line-100 bg-white'
        }`}
      >
        <div className={`px-5 py-5 ${navy ? 'border-b border-white/10' : 'border-b border-line-100'}`}>
          <Link href="/" className="block">
            <Logo size={20} tone={navy ? 'light' : 'dark'} />
          </Link>
          <p
            className={`mt-2 text-[10.5px] font-bold uppercase tracking-[0.1em] ${
              navy ? 'text-white/60' : 'text-ink-500'
            }`}
          >
            {roleLabel}
          </p>
        </div>

        <nav aria-label="Secciones" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} icon={item.icon} label={item.label} navy={navy} />
              </li>
            ))}
          </ul>
        </nav>

        <div className={`p-3 ${navy ? 'border-t border-white/10' : 'border-t border-line-100'}`}>
          <div className="flex items-center gap-3 rounded-field px-2 py-2">
            <Avatar initials={initials} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[13px] font-bold ${navy ? 'text-white' : 'text-navy-900'}`}>
                {userName}
              </p>
              {userSubtitle ? (
                <p className={`truncate text-[11.5px] ${navy ? 'text-white/60' : 'text-ink-500'}`}>
                  {userSubtitle}
                </p>
              ) : null}
            </div>
          </div>
          <SignOutButton navy={navy} />
        </div>
      </aside>

      {/* -------------------------------------------------- cabecera móvil */}
      <div className="flex-1 lg:ml-60">
        <header
          className={`sticky top-0 z-40 flex h-14 items-center justify-between px-4 lg:hidden ${
            navy ? 'bg-navy-950' : 'border-b border-line-100 bg-white/90 backdrop-blur-lg'
          }`}
        >
          <Link href="/" aria-label="BodGo" className="flex items-baseline gap-2">
            <Logo size={19} tone={navy ? 'light' : 'dark'} />
            <span
              className={`text-[9.5px] font-bold uppercase tracking-[0.12em] ${
                navy ? 'text-white/60' : 'text-ink-500'
              }`}
            >
              {roleLabel}
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            {avisos ? <BellLink {...avisos} navy={navy} /> : null}
            <Avatar initials={initials} size={30} />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:pb-14 lg:pt-8">{children}</main>
      </div>

      {/* ----------------------------------------------- barra inferior móvil */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-100 bg-white/95 backdrop-blur-lg lg:hidden"
      >
        <ul className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {primary.map((item) => (
            <li key={item.href} className="flex-1">
              <NavLink href={item.href} icon={item.icon} label={item.label} compact />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Campana con el contador de avisos sin leer. */
function BellLink({ href, sinLeer, navy }: { href: string; sinLeer: number; navy: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        navy ? 'text-white/80 hover:bg-white/10' : 'text-ink-700 hover:bg-surface-50'
      }`}
    >
      <Icon name="notificaciones" size={18} />
      {sinLeer > 0 ? (
        <span
          className={`absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold text-white ${
            navy ? 'bg-brand-600 ring-2 ring-navy-950' : 'bg-danger-600 ring-2 ring-white'
          }`}
        >
          {sinLeer > 9 ? '9+' : sinLeer}
        </span>
      ) : null}
      <span className="sr-only">
        {sinLeer > 0 ? `${sinLeer} avisos sin leer` : 'Notificaciones'}
      </span>
    </Link>
  );
}

export function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-navy-800 font-extrabold text-white ring-2 ring-white/15"
    >
      {initials}
    </span>
  );
}
