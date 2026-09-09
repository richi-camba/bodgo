import { AppShell, type NavItem } from '@/components/app/shell';
import { requireUser } from '@/lib/session';

const NAV: NavItem[] = [
  { href: '/admin', label: 'Resumen', icon: '📊', primary: true },
  { href: '/admin/discrepancias', label: 'Discrepancias', icon: '⚠️', primary: true },
  { href: '/admin/bodegas', label: 'Microbodegas', icon: '🏬', primary: true },
  { href: '/admin/pymes', label: 'PyMEs', icon: '🏢', primary: true },
  { href: '/admin/bodegueros', label: 'Bodegueros', icon: '👥' },
  { href: '/admin/repartidores', label: 'Repartidores', icon: '🛵' },
  { href: '/admin/corfo', label: 'Indicadores Corfo', icon: '🎯', primary: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('admin');

  return (
    <AppShell
      nav={NAV}
      roleLabel="Admin"
      userName={user.fullName}
      userSubtitle="Tamayaz SpA"
      initials={user.initials}
    >
      {children}
    </AppShell>
  );
}
