import type { Metadata } from 'next';
import { Icon } from '@/components/ui/icon';
import { StepHeader } from '@/components/app/step-header';
import { SectionLabel } from '@/components/app/rows';
import { CLAIM_WINDOW_HOURS, formatCompactCLP, INSURANCE_COVERAGE_CLP } from '@bodgo/core';

export const metadata: Metadata = { title: 'Ayuda y soporte' };

const FAQ = [
  {
    q: '¿Cuándo se le paga al bodeguero?',
    a: 'A fin de mes, neto del 15% de comisión. Tu pago queda en custodia desde que contratas y se libera recién cuando el bodeguero confirma que recibió lo que declaraste.',
  },
  {
    q: 'Llegó menos de lo que declaré. ¿Qué pasa?',
    a: `El bodeguero cuenta línea a línea contra el manifiesto. Si algo no calza se abre una discrepancia, te avisamos al instante y la plata sigue retenida mientras se resuelve. Tu inventario suma lo recibido, nunca lo declarado.`,
  },
  {
    q: '¿Qué cubre el seguro?',
    a: `Robo e incendio hasta ${formatCompactCLP(INSURANCE_COVERAGE_CLP)} por PyME. Si algo llegó dañado o falta stock, abre el reclamo dentro de las ${CLAIM_WINDOW_HOURS} horas siguientes a la recepción.`,
  },
  {
    q: '¿Puedo cortar el contrato antes de tiempo?',
    a: 'Sí, no hay plazo mínimo. Se prorratea sobre 30 días: el bodeguero cobra los días usados y el resto vuelve a tu medio de pago.',
  },
  {
    q: '¿Cuánto me cabe en los metros que contraté?',
    a: 'Los m² se traducen a volumen apilable hasta 1,8 m de altura: 12 m² son 21,6 m³ útiles. Cada envío se contrasta contra esa capacidad antes de salir, así te enteras antes de despachar y no en la recepción.',
  },
];

export default function HelpPage() {
  return (
    <div className="pb-6">
      <StepHeader titulo="Ayuda y soporte" volverA="/app/perfil" tomaLaPantalla={false} />

      <a
        href="mailto:ayuda@bodgo.cl"
        className="flex items-center gap-3 rounded-[16px] border border-line-100 bg-white p-4 transition-colors hover:border-navy-800"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brand-50 text-brand-600">
          <Icon name="correo" size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-bold text-navy-900">Escribir un correo</span>
          <span className="block text-[12px] text-ink-500">ayuda@bodgo.cl</span>
        </span>
        <span aria-hidden className="shrink-0 text-line-300">
          <Icon name="siguiente" size={14} />
        </span>
      </a>

      {/* El prototipo ofrece chat con soporte «responde en ~4 min». No hay
          equipo de soporte ni herramienta de chat todavía: prometer cuatro
          minutos y no contestar es peor que ofrecer sólo el correo. */}

      <SectionLabel>Preguntas frecuentes</SectionLabel>
      <div className="space-y-2.5">
        {FAQ.map((f) => (
          <details
            key={f.q}
            className="group overflow-hidden rounded-[14px] border border-line-100 bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-[13.5px] font-bold text-navy-900">
              <span className="flex-1">{f.q}</span>
              <span
                aria-hidden
                className="shrink-0 text-ink-500 transition-transform group-open:rotate-90"
              >
                <Icon name="siguiente" size={14} />
              </span>
            </summary>
            <p className="px-4 pb-4 text-[12.5px] leading-relaxed text-ink-700">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
