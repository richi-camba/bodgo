'use client';

import { useEffect } from 'react';

/**
 * Lleva al ancla cuando la página se abre con una.
 *
 * El salto nativo del navegador ocurre antes de que la portada termine de
 * armarse —las fotos todavía no ocupan su alto— así que el destino se corre y
 * se queda arriba. Importa porque /precios y /para-bodegueros ahora redirigen
 * a sus secciones: quien llega desde Google a la URL vieja tiene que aterrizar
 * donde dice el enlace, no en el encabezado.
 *
 * Sólo actúa al montar y sólo si nadie se movió todavía: si la persona ya
 * empezó a desplazarse, arrebatarle la página sería peor que no hacer nada.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || window.scrollY > 4) return;

    let cancelado = false;
    const cancelar = () => {
      cancelado = true;
    };
    window.addEventListener('wheel', cancelar, { once: true, passive: true });
    window.addEventListener('touchstart', cancelar, { once: true, passive: true });
    window.addEventListener('keydown', cancelar, { once: true });

    const ir = () => {
      if (cancelado) return;
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    };

    // Recién con todo cargado el alto de la página es el definitivo. Antes,
    // las fotos de abajo siguen creciendo y empujan el destino después del
    // salto: se aterriza dos mil píxeles más arriba de lo que dice el enlace.
    let t = 0;
    const alCargar = () => {
      ir();
      t = window.setTimeout(ir, 200);
    };

    if (document.readyState === 'complete') alCargar();
    else window.addEventListener('load', alCargar, { once: true });

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('load', alCargar);
      window.removeEventListener('wheel', cancelar);
      window.removeEventListener('touchstart', cancelar);
      window.removeEventListener('keydown', cancelar);
    };
  }, []);

  return null;
}
