import Link from 'next/link';
import type { Metadata } from 'next';
import { SignInForm } from './form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-tight text-white">Hola de nuevo</h1>
      <p className="mt-2 text-[14.5px] text-white/55">
        Inicia sesión para continuar en tu cuenta BodGo.
      </p>

      <div className="mt-7 rounded-[20px] bg-white p-6 shadow-lift">
        <SignInForm next={next} callbackError={error} />
      </div>

      <p className="mt-6 text-center text-[13.5px] text-white/55">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-bold text-brand-400 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
