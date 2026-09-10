import { AppShell, type NavItem } from '@/components/app/shell';
import { requireUser } from '@/lib/session';

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'metricas', primary: true },
  { href: '/admin/pymes', label: 'PyMEs', icon: 'pymes' },
  { href: '/admin/bodegueros', label: 'Bodegueros', icon: 'bodegueros' },
  { href: '/admin/bodegas', label: 'Microbodegas', icon: 'bodegas', primary: true },
  { href: '/admin/incidentes', label: 'Incidentes', icon: 'incidentes', primary: true },
  { href: '/admin/discrepancias', label: 'Discrepancias', icon: 'discrepancias', primary: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: 'pedidos', primary: true },
  { href: '/admin/corfo', label: 'Reportes Corfo', icon: 'corfo' },
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
      tono="navy"
    >
      {children}
    </AppShell>
  );
}
