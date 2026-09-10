'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Acceso con Google y Apple.
 *
 * Los proveedores hay que habilitarlos en el panel de Supabase; hasta
 * entonces esto no se muestra, porque un botón que falla al tocarlo es peor
 * que no tenerlo. Se enciende poniendo en el entorno, por ejemplo,
 * `NEXT_PUBLIC_OAUTH_PROVIDERS=google,apple`.
 */
const DISPONIBLES = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

const ETIQUETA: Record<string, string> = { google: 'Google', apple: 'Apple' };

export function SocialAuth({ next }: { next?: string }) {
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (DISPONIBLES.length === 0) return null;

  async function entrar(provider: string) {
    setCargando(provider);
    setError(null);

    const supabase = createClient();
    const destino = new URL('/auth/callback', window.location.origin);
    if (next) destino.searchParams.set('next', next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'apple',
      options: { redirectTo: destino.toString() },
    });

    if (error) {
      setCargando(null);
      setError('No pudimos abrir la sesión con ese proveedor. Prueba con tu correo.');
    }
  }

  return (
    <div className="pt-2">
      <p className="relative text-center text-[12px] text-ink-500">
        <span className="relative z-10 bg-white px-3">o continúa con</span>
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-line-200" />
      </p>

      <div className={`mt-4 grid gap-2 ${DISPONIBLES.length > 1 ? 'grid-cols-2' : ''}`}>
        {DISPONIBLES.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => entrar(provider)}
            disabled={cargando !== null}
            className="flex h-11 items-center justify-center rounded-field border border-line-200 text-[13.5px] font-bold text-navy-900 transition-colors hover:border-navy-800 disabled:opacity-60"
          >
            {cargando === provider ? 'Abriendo…' : (ETIQUETA[provider] ?? provider)}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[12.5px] font-semibold text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
