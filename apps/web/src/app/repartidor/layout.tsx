import { AppShell, type NavItem } from '@/components/app/shell';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/session';
import { LABELS } from '@bodgo/core';

const NAV: NavItem[] = [
  { href: '/repartidor', label: 'Viajes', icon: '🛵', primary: true },
  { href: '/repartidor/ganancias', label: 'Ganancias', icon: '💰', primary: true },
  { href: '/repartidor/perfil', label: 'Perfil', icon: '⚙️', primary: true },
];

export default async function CourierLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser('repartidor');
  const supabase = await createClient();

  const { data: courier } = await supabase
    .from('courier_profiles')
    .select('vehicle, plate, rating, trips_count')
    .eq('profile_id', user.id)
    .single();

  return (
    <AppShell
      nav={NAV}
      roleLabel="Repartidor"
      userName={user.fullName}
      userSubtitle={
        courier
          ? `${LABELS.vehicle[courier.vehicle]}${courier.plate ? ` · ${courier.plate}` : ''}`
          : undefined
      }
      initials={user.initials}
    >
      {children}
    </AppShell>
  );
}
