import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/logo';
import { SkipWelcome } from './skip-welcome';

/**
 * Armazón de la bienvenida.
 *
 * Cabecera en degradado con la barra de pasos, contenido en el medio y la
 * acción abajo, como en el prototipo. No usa `AppShell` a propósito: mientras
 * se pone en marcha la cuenta no hay a dónde navegar, y una barra de
 * pestañas invitaría a irse a secciones todavía vacías.
 */
export function WelcomeShell({
  paso,
  total,
  titulo,
  bajada,
  children,
  acciones,
  saltar = true,
}: {
  paso: number;
  total: number;
  titulo: string;
  bajada: string;
  children?: ReactNode;
  acciones: ReactNode;
  /**
   * Muestra «Saltar por ahora». Es un segundo botón de envío, así que sólo
   * sirve cuando el armazón va dentro de un `<form>`.
   */
  saltar?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <header className="bg-gradient-to-br from-navy-800 to-navy-950 px-6 pb-6 pt-10 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <Logo tone="light" size={21} />
          <p className="shrink-0 text-[12px] font-semibold text-white/60">
            Paso {paso} de {total}
          </p>
        </div>

        <ol
          className="mx-auto mt-[18px] flex max-w-2xl gap-1.5"
          aria-label={`Progreso: paso ${paso} de ${total}`}
        >
          {Array.from({ length: total }).map((_, i) => (
            <li
              key={i}
              aria-current={i + 1 === paso ? 'step' : undefined}
              className={`h-[5px] flex-1 rounded-pill ${i < paso ? 'bg-brand-400' : 'bg-white/20'}`}
            />
          ))}
        </ol>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-[22px] pb-5 pt-[26px]">
        <h1 className="text-[23px] font-extrabold leading-[1.15] tracking-tight text-navy-900">
          {titulo}
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500">{bajada}</p>

        {children}
      </div>

      <div className="sticky bottom-0 border-t border-line-100 bg-white px-[22px] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3.5">
        <div className="mx-auto flex max-w-2xl items-center gap-3">{acciones}</div>
        {saltar ? (
          <div className="mx-auto mt-2 max-w-2xl text-center">
            <SkipWelcome />
          </div>
        ) : null}
      </div>
    </div>
  );
}
