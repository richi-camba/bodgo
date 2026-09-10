import Link from 'next/link';
import type { Metadata } from 'next';
import { SignUpForm } from './form';
import { RoleChooser } from './role-chooser';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const { rol } = await searchParams;
  const role = rol === 'bodeguero' || rol === 'pyme' ? rol : null;

  if (!role) {
    return (
      <div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-white">
          ¿Cómo quieres usar BodGo?
        </h1>
        <p className="mt-2 text-[14.5px] text-white/70">
          Elige tu perfil y te configuramos la cuenta en pocos pasos.
        </p>

        <div className="mt-7">
          <RoleChooser />
        </div>

        <p className="mt-6 text-center text-[13.5px] text-white/70">
          ¿Ya tienes cuenta?{' '}
          <Link href="/ingresar" className="font-bold text-brand-400 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    );
  }

  const COPY = {
    pyme: {
      title: 'Crea tu cuenta PyME',
      body: 'Guarda tu stock cerca de tus clientes y despacha más rápido.',
    },
    bodeguero: {
      title: 'Publica tu espacio',
      body: 'Recibe mercancía, prepara pedidos y genera ingresos con el espacio que ya tienes.',
    },
  } as const;

  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-tight text-white">{COPY[role].title}</h1>
      <p className="mt-2 text-[14.5px] text-white/70">{COPY[role].body}</p>

      <div className="mt-7 rounded-[20px] bg-white p-6 shadow-lift">
        <SignUpForm role={role} />
      </div>

      <p className="mt-6 text-center text-[13.5px] text-white/70">
        <Link href="/registro" className="font-semibold text-white/70 hover:underline">
          Cambiar perfil
        </Link>
        <span className="px-2 text-white/70">·</span>
        <Link href="/ingresar" className="font-bold text-brand-400 hover:underline">
          Ya tengo cuenta
        </Link>
      </p>
    </div>
  );
}
