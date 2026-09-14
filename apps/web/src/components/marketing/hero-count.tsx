'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cifra del hero que sube desde cero al entrar en pantalla.
 *
 * El prototipo las anima; el movimiento es lo que hace que se lean como una
 * red viva y no como una placa. Respeta `prefers-reduced-motion`: a quien
 * pidió menos movimiento le aparece el número final y listo.
 */
export function HeroCount({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const marca = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = marca.current;
    if (!nodo) return;

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto || to === 0) {
      setN(to);
      return;
    }

    let animacion = 0;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        observador.disconnect();

        const inicio = performance.now();
        const duracion = 900;

        const paso = (ahora: number) => {
          const t = Math.min(1, (ahora - inicio) / duracion);
          // Desacelera al final: el número aterriza en vez de frenar de golpe.
          setN(Math.round(to * (1 - (1 - t) ** 3)));
          if (t < 1) animacion = requestAnimationFrame(paso);
        };

        animacion = requestAnimationFrame(paso);
      },
      { threshold: 0.4 },
    );

    observador.observe(nodo);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(animacion);
    };
  }, [to]);

  return (
    <span ref={marca} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
