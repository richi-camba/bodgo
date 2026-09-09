import Link from 'next/link';

const OPTIONS = [
  {
    role: 'pyme',
    icon: '📦',
    title: 'Quiero enviar pedidos',
    body: 'Soy una PyME: contrato bodega, guardo stock y despacho a mis clientes.',
  },
  {
    role: 'bodeguero',
    icon: '🏠',
    title: 'Quiero ser bodeguero',
    body: 'Tengo un espacio: recibo mercancía, preparo pedidos y genero ingresos.',
  },
  {
    role: 'repartidor',
    icon: '🛵',
    title: 'Quiero repartir',
    body: 'Tengo vehículo: retiro pedidos en las bodegas y los entrego al comprador.',
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
            <span
              aria-hidden
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field bg-brand-50 text-[20px]"
            >
              {option.icon}
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
