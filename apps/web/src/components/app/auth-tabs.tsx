import Link from 'next/link';

/**
 * Conmutador entre entrar y registrarse.
 *
 * En el prototipo son pestañas dentro de la tarjeta. Acá son enlaces y no un
 * estado del cliente: cada una es su propia URL, se puede compartir, y el
 * parámetro de rol del registro sobrevive a la navegación.
 */
export function AuthTabs({ activa, rol }: { activa: 'ingresar' | 'registro'; rol?: string }) {
  const registro = rol ? `/registro?rol=${rol}` : '/registro';

  return (
    <div className="grid grid-cols-2 gap-1 rounded-field bg-surface-100 p-1">
      <Tab href="/ingresar" activa={activa === 'ingresar'}>
        Iniciar sesión
      </Tab>
      <Tab href={registro} activa={activa === 'registro'}>
        Registrarse
      </Tab>
    </div>
  );
}

function Tab({
  href,
  activa,
  children,
}: {
  href: string;
  activa: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? 'page' : undefined}
      className={`flex h-10 items-center justify-center rounded-[10px] text-[13.5px] font-bold transition-colors ${
        activa ? 'bg-white text-navy-900 shadow-card' : 'text-ink-500 hover:text-navy-800'
      }`}
    >
      {children}
    </Link>
  );
}
