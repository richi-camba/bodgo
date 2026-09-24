'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';

/**
 * Salida de las páginas legales.
 *
 * Quien llega acá desde el registro no puede quedarse sin puerta: el
 * documento es largo y al final no había nada que lo devolviera. Si la
 * pestaña se abrió desde el formulario, lo correcto es cerrarla —volver
 * atrás recargaría el registro y se perdería lo escrito—; si se llegó
 * navegando, se vuelve a la página anterior, y si no hay historia, al inicio.
 */
export function VolverLegal({ abajo }: { abajo?: boolean }) {
  const [esPestanaAparte, setEsPestanaAparte] = useState(false);
  const [hayHistoria, setHayHistoria] = useState(false);

  useEffect(() => {
    // `opener` sólo existe si esta pestaña la abrió otra página nuestra.
    setEsPestanaAparte(window.opener != null && !window.opener.closed);
    setHayHistoria(window.history.length > 1);
  }, []);

  const clases = `inline-flex items-center gap-2 rounded-field border border-line-200 bg-white px-4 py-2.5 text-[13.5px] font-bold text-navy-800 transition-colors hover:border-navy-800 ${
    abajo ? '' : 'mb-8'
  }`;

  if (esPestanaAparte) {
    return (
      <button type="button" onClick={() => window.close()} className={clases}>
        <Icon name="cerrar" size={15} />
        Cerrar y volver al registro
      </button>
    );
  }

  if (hayHistoria) {
    return (
      <button type="button" onClick={() => window.history.back()} className={clases}>
        <Icon name="volver" size={15} />
        Volver
      </button>
    );
  }

  return (
    <Link href="/" className={clases}>
      <Icon name="volver" size={15} />
      Volver al inicio
    </Link>
  );
}
