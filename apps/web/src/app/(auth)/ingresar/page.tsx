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
      <h1 className="text-[26px] font-extrabold tracking-tight text-navy-900">Hola de nuevo</h1>
      <p className="mt-2 text-[14.5px] text-ink-500">
        Inicia sesión para continuar en tu cuenta BodGo.
      </p>

      <div className="mt-7 rounded-[20px] border border-line-100 bg-white p-6 shadow-card">
        <SignInForm next={next} callbackError={error} />
      </div>

      <p className="mt-6 text-center text-[13.5px] text-ink-500">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-bold text-brand-600 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
