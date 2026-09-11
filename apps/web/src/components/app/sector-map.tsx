'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Sector aproximado de una microbodega.
 *
 * Dibuja un círculo, no un punto: la vista del buscador entrega las
 * coordenadas redondeadas a unos 110 metros y la calle exacta se revela con
 * el contrato firmado. El círculo hace visible esa imprecisión en vez de
 * fingir una exactitud que la fila no tiene.
 */
export function SectorMap({
  lat,
  lng,
  comuna,
}: {
  lat: number;
  lng: number;
  comuna: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<import('leaflet').Map | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');

  useEffect(() => {
    let cancelado = false;

    async function dibujar() {
      const nodo = contenedor.current;
      if (!nodo) return;

      try {
        const L = (await import('leaflet')).default;
        if (cancelado || !contenedor.current) return;

        // React monta dos veces en desarrollo y el import es asíncrono: la
        // instancia se guarda en una ref para que la limpieza encuentre la
        // que realmente se creó, aunque se cree después de desmontar.
        mapaRef.current?.remove();
        const mapa = L.map(nodo, {
          scrollWheelZoom: false,
          dragging: false,
          zoomControl: false,
          doubleClickZoom: false,
          touchZoom: false,
          keyboard: false,
        });
        mapaRef.current = mapa;

        if (cancelado) {
          mapa.remove();
          mapaRef.current = null;
          return;
        }

        // La vista va antes que las capas: sin centro ni zoom, Leaflet no
        // sabe proyectar y el círculo revienta al calcular sus límites.
        mapa.setView([lat, lng], 14);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 16,
          attribution: '&copy; colaboradores de OpenStreetMap',
        }).addTo(mapa);

        const radio = 600;
        const zona = L.circle([lat, lng], {
          radius: radio,
          color: '#2c72b7',
          weight: 2,
          opacity: 0.6,
          fillColor: '#2c72b7',
          fillOpacity: 0.16,
        }).addTo(mapa);

        mapa.fitBounds(zona.getBounds(), { padding: [16, 16] });
        setEstado('listo');
      } catch (e) {
        // Sin el mapa la pantalla sigue siendo útil, pero el motivo tiene que
        // quedar en la consola: si no, una falla de red se ve igual que un
        // error de programación.
        console.error('[mapa]', e);
        if (!cancelado) setEstado('error');
      }
    }

    void dibujar();

    return () => {
      cancelado = true;
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div className="relative mt-3 h-40 overflow-hidden rounded-card border border-line-200 bg-surface-100">
      <div
        ref={contenedor}
        className="h-full w-full"
        role="img"
        aria-label={`Sector aproximado en ${comuna}. La dirección exacta se revela al contratar.`}
      />

      {estado === 'listo' ? (
        <span className="pointer-events-none absolute bottom-2.5 left-1/2 z-[500] -translate-x-1/2 rounded-pill bg-white/90 px-2.5 py-1 text-[11px] font-bold text-navy-900 backdrop-blur-sm">
          {comuna}
        </span>
      ) : (
        <p
          role="status"
          className="absolute inset-0 flex items-center justify-center text-[12.5px] font-semibold text-ink-500"
        >
          {estado === 'error' ? `Sector aproximado en ${comuna}` : 'Cargando el sector…'}
        </p>
      )}
    </div>
  );
}
