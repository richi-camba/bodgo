import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/icon';

const OPTIONS: { role: string; icon: IconName; title: string; body: string }[] = [
  {
    role: 'pyme',
    icon: 'inventario',
    title: 'Quiero enviar pedidos',
    body: 'Soy una PyME: contrato bodega, guardo stock y despacho a mis clientes.',
  },
  {
    role: 'bodeguero',
    icon: 'espacios',
    title: 'Quiero ser bodeguero',
    body: 'Tengo un espacio: recibo mercancía, preparo pedidos y genero ingresos.',
  },
] as const;

export function RoleChooser() {
  return (
    <ul className="space-y-3">
      {OPTIONS.map((option) => (
        <li key={option.role}>
          <Link
            href={`/registro?rol=${option.role}`}
            className="group flex items-start gap-4 rounded-[18px] bg-white p-5 transition-shadow hover:shadow-lift"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field bg-brand-50 text-brand-600">
              <Icon name={option.icon} size={20} />
            </span>
            <span className="flex-1">
              <span className="block text-[16px] font-extrabold text-navy-900">{option.title}</span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-500">{option.body}</span>
              <span className="mt-3 inline-block text-[13px] font-bold text-brand-600 group-hover:underline">
                Empezar →
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
