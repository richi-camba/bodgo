'use client';

import { useState } from 'react';

const QUESTIONS = [
  {
    q: '¿Cómo se cobra el arriendo?',
    a: 'Se cobra por adelantado al contratar y el monto queda en custodia. Al bodeguero se le paga a fin de mes por los días efectivamente usados. Si terminas antes, te devolvemos la parte proporcional de los días que no ocupaste.',
  },
  {
    q: '¿Qué pasa si llega menos mercadería de la que declaré?',
    a: 'El bodeguero cuenta producto por producto contra tu manifiesto al recibir. Si algo no calza, se abre una discrepancia al instante, te llega el aviso con el detalle y el pago sigue retenido hasta que se resuelva.',
  },
  {
    q: '¿Puedo guardar más volumen del que contraté?',
    a: 'La capacidad se mide en m³ apilables, no sólo en m². Al armar un envío te mostramos cuánto ocupa contra tu capacidad contratada. Si te pasas, puedes ampliar el contrato o dividir el envío; si llega igual, el bodeguero puede rechazar el excedente.',
  },
  {
    q: '¿Está asegurada mi mercadería?',
    a: 'Sí. Todo espacio publicado queda cubierto por el seguro de la red, que responde por robo e incendio hasta 2 millones de pesos por PyME.',
  },
  {
    q: '¿Qué necesito para publicar mi espacio como bodeguero?',
    a: 'Un espacio despejado con acceso independiente y cierre seguro. Publicas el aviso, un evaluador de BodGo agenda una visita de habilitación en 3 a 5 días hábiles y verifica el checklist antes de que aparezca en la red. No hay costo de inscripción.',
  },
  {
    q: '¿Puedo usar mis propios canales de venta?',
    a: 'Sí. Las ventas de Mercado Libre y Shopify entran solas a tu bandeja de pedidos, y también puedes crear despachos a mano. El bodeguero prepara el pedido y lo entrega al courier que elijas.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <ul className="divide-y divide-line-100 border-y border-line-100">
        {QUESTIONS.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="text-[15.5px] font-bold text-navy-900">{item.q}</span>
                  <span
                    aria-hidden
                    className={`shrink-0 text-[20px] font-light text-ink-400 transition-transform ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
              </h3>
              {isOpen ? (
                <p className="-mt-1 pb-6 pr-10 text-[14.5px] leading-relaxed text-ink-500">{item.a}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
