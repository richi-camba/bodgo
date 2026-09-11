'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { formatCLP, formatNumber } from '@bodgo/core';

export type MapPin = {
  id: string;
  comuna: string;
  lat: number;
  lng: number;
  pricePerM2: number;
  availableM2: number;
};

type Props = {
  pins: MapPin[];
  /** Cuántas microbodegas del resultado no tienen coordenadas cargadas. */
  sinUbicacion: number;
  /** Centro de referencia: la comuna de la PyME, si la tiene. */
  origen: { lat: number; lng: number; label: string } | null;
};

/**
 * Mapa del buscador.
 *
 * Leaflet sobre teselas de OpenStreetMap. El prototipo dibuja un mapa
 * decorativo con los precios en posiciones fijas; acá las posiciones son las
 * coordenadas reales de cada espacio, porque la pregunta que trae a alguien
 * al mapa —«¿me queda cerca?»— no se puede contestar con un dibujo.
 *
 * La librería se carga recién al abrir la pestaña: son unos 40 kB que no
 * tienen por qué viajar con la lista, que es la vista por defecto.
 */
export function WarehouseMap({ pins, sinUbicacion, origen }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<import('leaflet').Map | null>(null);
  const router = useRouter();
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
        const mapa = L.map(nodo, { scrollWheelZoom: false, attributionControl: true });
        mapaRef.current = mapa;

        if (cancelado) {
          mapa.remove();
          mapaRef.current = null;
          return;
        }

        // La vista va antes que las capas: sin centro ni zoom, Leaflet no
        // sabe proyectar lo que se le agrega encima.
        mapa.setView([-33.45, -70.66], 11);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; colaboradores de OpenStreetMap',
        }).addTo(mapa);

        const puntos: [number, number][] = pins.map((p) => [p.lat, p.lng]);

        for (const p of pins) {
          // El pin es el precio, como en el prototipo: es el dato por el que
          // se compara un espacio con otro de un vistazo.
          const marca = L.marker([p.lat, p.lng], {
            keyboard: true,
            title: `${p.comuna} · ${formatCLP(p.pricePerM2)} por m²`,
            icon: L.divIcon({
              className: '',
              html: `<span class="pin-bodega"><b>${formatCLP(p.pricePerM2)}</b><i>${formatNumber(p.availableM2, 1)} m² libres</i></span>`,
              iconSize: [0, 0],
            }),
          }).addTo(mapa);

          marca.on('click', () => router.push(`/app/buscar/${p.id}`));
        }

        if (origen) {
          puntos.push([origen.lat, origen.lng]);
          L.circleMarker([origen.lat, origen.lng], {
            radius: 7,
            color: '#2c72b7',
            weight: 3,
            fillColor: '#fff',
            fillOpacity: 1,
          })
            .addTo(mapa)
            .bindTooltip(`Tu comuna · ${origen.label}`, { direction: 'top' });
        }

        if (puntos.length) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 14 });
        else mapa.setView([-33.45, -70.66], 11);

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
  }, [pins, origen, router]);

  return (
    <div className="space-y-2.5">
      <div className="relative overflow-hidden rounded-[18px] border border-line-100 bg-surface-100">
        <div ref={contenedor} className="h-[340px] w-full" role="application" aria-label="Mapa de microbodegas" />

        {estado !== 'listo' ? (
          <p
            role="status"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface-100 text-center text-[13px] font-semibold text-ink-500"
          >
            {estado === 'error'
              ? 'No se pudo cargar el mapa. La lista sigue disponible.'
              : 'Cargando el mapa…'}
          </p>
        ) : null}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-500">
        <Icon name="ubicacion" size={13} />
        {pins.length === 0
          ? 'Ninguna microbodega del resultado tiene ubicación cargada.'
          : 'Toca un precio para ver la microbodega.'}
        {sinUbicacion > 0 && pins.length > 0
          ? ` ${sinUbicacion} sin ubicación quedan sólo en la lista.`
          : ''}
      </p>
    </div>
  );
}
