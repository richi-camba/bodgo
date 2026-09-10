import Link from 'next/link';
import type { Metadata } from 'next';
import { ResetRequestForm } from './form';

export const metadata: Metadata = { title: 'Recuperar contraseña' };

export default function RecoverPage() {
  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-tight text-white">
        ¿Olvidaste tu contraseña?
      </h1>
      <p className="mt-2 text-[14.5px] text-white/55">
        Escribe tu correo y te mandamos un enlace para crear una nueva.
      </p>

      <div className="mt-7 rounded-[20px] bg-white p-6 shadow-lift">
        <ResetRequestForm />
      </div>

      <p className="mt-6 text-center text-[13.5px] text-white/55">
        <Link href="/ingresar" className="font-bold text-brand-400 hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
