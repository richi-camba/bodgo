import { AppShell, type NavItem } from '@/components/app/shell';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';

const NAV: NavItem[] = [
  { href: '/bodeguero', label: 'Inicio', icon: '🏠', primary: true },
  { href: '/bodeguero/recepciones', label: 'Recepciones', icon: '📥', primary: true },
  { href: '/bodeguero/pedidos', label: 'Pedidos', icon: '📋', primary: true },
  { href: '/bodeguero/inventario', label: 'Inventario', icon: '📦', primary: true },
  { href: '/bodeguero/espacios', label: 'Mis espacios', icon: '🏬' },
  { href: '/bodeguero/pagos', label: 'Pagos', icon: '💳', primary: true },
];

export default async function BodegueroLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('bodeguero');
  const supabase = await createClient();

  const { data: spaces } = await supabase.from('warehouses').select('total_m2');
  const totalM2 = (spaces ?? []).reduce((s, w) => s + Number(w.total_m2), 0);

  return (
    <AppShell
      nav={NAV}
      roleLabel="Bodeguero"
      userName={user.fullName}
      userSubtitle={
        spaces?.length
          ? `${spaces.length} ${spaces.length === 1 ? 'espacio' : 'espacios'} · ${totalM2} m²`
          : 'Sin espacios publicados'
      }
      initials={user.initials}
    >
      {children}
    </AppShell>
  );
}
