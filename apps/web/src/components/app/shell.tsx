import Link from 'next/link';
import type { IconName } from '@/components/ui/icon';
import { Logo } from '@/components/ui/logo';
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
  children: React.ReactNode;
};

/**
 * Armazón de las tres apps internas.
 *
 * En escritorio es una barra lateral fija; en móvil, una barra inferior con los
 * accesos principales, como en el prototipo. La misma página sirve a ambos: no
 * hay dos árboles de rutas que mantener sincronizados.
 */
export function AppShell({ nav, roleLabel, userName, userSubtitle, initials, children }: Props) {
  const primary = nav.filter((item) => item.primary);

  return (
    <div className="min-h-screen bg-surface-50 lg:flex">
      {/* ------------------------------------------------ barra lateral */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line-100 bg-white lg:flex lg:fixed lg:inset-y-0">
        <div className="border-b border-line-100 px-5 py-5">
          <Link href="/" className="block">
            <Logo size={20} />
          </Link>
          <p className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
            {roleLabel}
          </p>
        </div>

        <nav aria-label="Secciones" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} icon={item.icon} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-line-100 p-3">
          <div className="flex items-center gap-3 rounded-field px-2 py-2">
            <Avatar initials={initials} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-navy-900">{userName}</p>
              {userSubtitle ? (
                <p className="truncate text-[11.5px] text-ink-400">{userSubtitle}</p>
              ) : null}
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* -------------------------------------------------- cabecera móvil */}
      <div className="flex-1 lg:ml-60">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line-100 bg-white/90 px-4 backdrop-blur-lg lg:hidden">
          <Link href="/" aria-label="BodGo">
            <Logo size={19} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">
              {roleLabel}
            </span>
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

export function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-navy-800 font-extrabold text-white"
    >
      {initials}
    </span>
  );
}
