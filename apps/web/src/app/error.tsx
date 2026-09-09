'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Último recurso cuando una pantalla se cae.
 *
 * No muestra el error crudo: para quien lo lee no significa nada y puede
 * filtrar detalles de la consulta que falló. Va a la consola, donde sirve.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[bodgo]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="max-w-sm text-center">
        <h1 className="text-[20px] font-extrabold tracking-tight text-navy-900">
          Algo se rompió de nuestro lado
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
          No es culpa tuya y no perdiste nada de lo que estabas haciendo. Vuelve a intentarlo; si
          sigue igual, escríbenos a{' '}
          <a href="mailto:ayuda@bodgo.cl" className="font-bold text-brand-600 hover:underline">
            ayuda@bodgo.cl
          </a>
          .
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-ink-400">Referencia: {error.digest}</p>
        ) : null}
        <Button onClick={reset} className="mt-6">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
