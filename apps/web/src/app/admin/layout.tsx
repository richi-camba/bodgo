import { AppShell, type NavItem } from '@/components/app/shell';
import { requireUser } from '@/lib/session';

const NAV: NavItem[] = [
  { href: '/admin', label: 'Resumen', icon: 'metricas', primary: true },
  { href: '/admin/discrepancias', label: 'Discrepancias', icon: 'discrepancias', primary: true },
  { href: '/admin/bodegas', label: 'Microbodegas', icon: 'bodegas', primary: true },
  { href: '/admin/pymes', label: 'PyMEs', icon: 'pymes', primary: true },
  { href: '/admin/bodegueros', label: 'Bodegueros', icon: 'bodegueros' },
  { href: '/admin/corfo', label: 'Indicadores Corfo', icon: 'corfo', primary: true },
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
