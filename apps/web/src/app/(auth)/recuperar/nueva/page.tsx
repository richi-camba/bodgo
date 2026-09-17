import type { Metadata } from 'next';
import { NewPasswordForm } from './form';

export const metadata: Metadata = { title: 'Nueva contraseña' };

export default function NewPasswordPage() {
  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-tight text-navy-900">
        Crea tu contraseña nueva
      </h1>
      <p className="mt-2 text-[14.5px] text-ink-500">
        Después de guardarla entras directo a tu cuenta.
      </p>

      <div className="mt-7 rounded-[20px] border border-line-100 bg-white p-6 shadow-card">
        <NewPasswordForm />
      </div>
    </div>
  );
}
