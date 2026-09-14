'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Cifra del hero que sube desde cero al entrar en pantalla.
 *
 * El prototipo las anima; el movimiento es lo que hace que se lean como una
 * red viva y no como una placa. Pero el valor de partida es el final, no
 * cero: así el número es correcto en el HTML del servidor, sin JavaScript y
 * cuando la cifra queda bajo el pliegue y nadie llega a hacerla entrar en
 * pantalla. La animación sólo baja a cero al montar, y únicamente si el
 * sistema no pidió menos movimiento.
 */
export function HeroCount({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [n, setN] = useState(to);
  const marca = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = marca.current;
    if (!nodo) return;

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (quieto || to === 0) return;

    setN(0);

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
      // Si el componente se va a mitad de la animación, el número queda en
      // su valor real y no en el que iba subiendo.
      setN(to);
    };
  }, [to]);

  return (
    <span ref={marca} className="tabular-nums">
      {n}
      {suffix}
    </span>
  );
}
