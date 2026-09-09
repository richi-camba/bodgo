'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/icon';

export function NavLink({
  href,
  icon,
  label,
  compact,
}: {
  href: string;
  icon: IconName;
  label: string;
  compact?: boolean;
}) {
  const pathname = usePathname();
  // La raíz de cada app sólo se marca activa en coincidencia exacta; el resto,
  // también en sus subrutas, para que el detalle de un pedido siga iluminando
  // "Mis pedidos".
  const depth = href.split('/').filter(Boolean).length;
  const active = depth <= 1 ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (compact) {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-bold ${
          active ? 'text-navy-800' : 'text-ink-400'
        }`}
      >
        <Icon name={icon} size={20} />
        <span className="max-w-full truncate">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-field px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
        active ? 'bg-navy-800 text-white' : 'text-ink-700 hover:bg-surface-50'
      }`}
    >
      <Icon name={icon} size={17} />
      {label}
    </Link>
  );
}
