import { AppShell, type NavItem } from '@/components/app/shell';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';

const NAV: NavItem[] = [
  { href: '/bodeguero', label: 'Inicio', icon: 'inicio', primary: true },
  { href: '/bodeguero/recepciones', label: 'Recepciones', icon: 'recepciones', primary: true },
  { href: '/bodeguero/pedidos', label: 'Pedidos', icon: 'pedidos', primary: true },
  { href: '/bodeguero/inventario', label: 'Inventario', icon: 'inventario', primary: true },
  { href: '/bodeguero/espacios', label: 'Mis espacios', icon: 'espacios' },
  { href: '/bodeguero/pagos', label: 'Pagos', icon: 'pagos', primary: true },
  { href: '/bodeguero/notificaciones', label: 'Notificaciones', icon: 'notificaciones' },
];

export default async function BodegueroLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('bodeguero');
  const supabase = await createClient();

  const [{ data: spaces }, { count: sinLeer }] = await Promise.all([
    supabase.from('warehouses').select('total_m2'),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).is('read_at', null),
  ]);

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
      avisos={{ href: '/bodeguero/notificaciones', sinLeer: sinLeer ?? 0 }}
    >
      {children}
    </AppShell>
  );
}
