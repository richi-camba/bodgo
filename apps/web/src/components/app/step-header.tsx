import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';

/**
 * Cabecera de pantalla con vuelta atrás.
 *
 * Del prototipo: flecha en un círculo blanco y título en 800. Si el flujo
 * lleva la cuenta de pasos aparece «Paso N de M» y una barra segmentada
 * —segmentos y no una barra continua, porque a mitad de un formulario largo
 * la pregunta real es cuántos pasos faltan, no qué porcentaje va—.
 *
 * `tomaLaPantalla` decide si esconde la barra de pestañas. Va en true cuando
 * la pantalla es un flujo que hay que terminar (contratar, enviar, verificar
 * una recepción) y en false cuando es sólo una ficha que se mira, como el
 * detalle de un producto: ahí saltar a otra sección no pierde nada.
 */
export function StepHeader({
  titulo,
  subtitulo,
  paso,
  total,
  volverA,
  accion,
  tomaLaPantalla = true,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  paso?: number;
  total?: number;
  volverA: string;
  accion?: ReactNode;
  tomaLaPantalla?: boolean;
}) {
  const conPasos = paso != null && total != null;
  const tamano = conPasos ? 'text-[18px]' : subtitulo ? 'text-[17px]' : 'text-[19px]';

  return (
    <header className="mb-5" {...(tomaLaPantalla ? { 'data-flujo-pasos': '' } : {})}>
      <div className="flex items-center gap-3.5">
        <Link
          href={volverA}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-200 bg-white text-navy-900 transition-colors hover:border-navy-800"
        >
          <Icon name="volver" size={17} label="Volver" />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className={`truncate font-extrabold tracking-tight text-navy-900 ${tamano}`}>
            {titulo}
          </h1>
          {conPasos ? (
            <p className="mt-px text-[12px] text-ink-500">
              Paso {paso} de {total}
            </p>
          ) : subtitulo ? (
            <div className="mt-px text-[12px] text-ink-500">{subtitulo}</div>
          ) : null}
        </div>

        {accion ? <div className="shrink-0">{accion}</div> : null}
      </div>

      {conPasos ? (
        <ol className="mt-4 flex gap-1.5" aria-label={`Progreso: paso ${paso} de ${total}`}>
          {Array.from({ length: total! }).map((_, i) => (
            <li
              key={i}
              aria-current={i + 1 === paso ? 'step' : undefined}
              className={`h-[5px] flex-1 rounded-pill ${i < paso! ? 'bg-brand-600' : 'bg-line-200'}`}
            />
          ))}
        </ol>
      ) : null}
    </header>
  );
}

/**
 * Barra fija de acción, pegada al borde inferior.
 *
 * Mientras dura el flujo reemplaza a la barra de pestañas —la esconde la regla
 * de `globals.css` que busca `data-flujo-pasos`—: el paso manda, y salir a otra
 * sección a mitad de camino sólo perdería lo cargado. Cuando hay total, viaja
 * con vos: nunca hay que subir a comprobar cuánto va a salir.
 */
export function StickyBar({
  etiqueta,
  valor,
  children,
}: {
  etiqueta?: string;
  valor?: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3.5 shadow-[0_-4px_18px_rgba(16,36,58,.06)] lg:sticky lg:bottom-4 lg:mt-6 lg:rounded-card lg:border lg:pb-3.5">
      <div className="mx-auto flex max-w-5xl items-center gap-4">
        {valor ? (
          <div className="min-w-0 shrink-0">
            {etiqueta ? <p className="text-[11px] text-ink-500">{etiqueta}</p> : null}
            <p className="text-[19px] font-extrabold leading-none text-navy-900 tabular-nums">
              {valor}
            </p>
          </div>
        ) : null}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
