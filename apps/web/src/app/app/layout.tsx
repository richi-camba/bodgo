import { AppShell, type NavItem } from '@/components/app/shell';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';

const NAV: NavItem[] = [
  { href: '/app', label: 'Inicio', icon: '🏠', primary: true },
  { href: '/app/buscar', label: 'Buscar bodegas', icon: '🔍', primary: true },
  { href: '/app/despachos', label: 'Envíos a bodega', icon: '🚚' },
  { href: '/app/pedidos', label: 'Mis pedidos', icon: '📋', primary: true },
  { href: '/app/inventario', label: 'Mi inventario', icon: '📦', primary: true },
  { href: '/app/contratos', label: 'Mis contratos', icon: '📄' },
  { href: '/app/metricas', label: 'Métricas', icon: '📊', primary: true },
  { href: '/app/perfil', label: 'Mi perfil', icon: '⚙️' },
];

export default async function PymeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('pyme');
  const supabase = await createClient();

  const { data: pyme } = await supabase
    .from('pyme_profiles')
    .select('business_name')
    .eq('profile_id', user.id)
    .single();

  return (
    <AppShell
      nav={NAV}
      roleLabel="PyME"
      userName={user.fullName}
      userSubtitle={pyme?.business_name ?? undefined}
      initials={user.initials}
    >
      {children}
    </AppShell>
  );
}
