'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { sendMessage, type CommsState } from '@/app/comms/actions';
import { Icon } from '@/components/ui/icon';

export type Message = {
  id: string;
  body: string;
  mio: boolean;
  autor: string;
  hora: string;
};

/**
 * Hilo de conversación con su caja de escritura.
 *
 * El envío es una acción de servidor dentro de un formulario: escribir y dar
 * Enter funciona igual sin JavaScript, y el mensaje no se pierde si la
 * conexión se cae a mitad de camino.
 *
 * No hay tiempo real todavía: los mensajes nuevos aparecen al recargar o al
 * enviar. Ponerle un «en línea» parpadeante sin eso sería decorar una
 * promesa que la app no cumple.
 */
export function MessageThread({
  conversationId,
  messages,
  aviso,
}: {
  conversationId: string;
  messages: Message[];
  /** Nota de contexto sobre el hilo, como el «chat previo» del prototipo. */
  aviso?: string;
}) {
  const [state, action] = useActionState<CommsState, FormData>(sendMessage, null);
  const caja = useRef<HTMLFormElement>(null);
  const fondo = useRef<HTMLDivElement>(null);

  // Al enviar, limpiar el campo y bajar al último mensaje: es lo que hace
  // cualquier chat y evita escribir a ciegas sobre el texto anterior.
  useEffect(() => {
    if (state?.ok) caja.current?.reset();
  }, [state]);

  useEffect(() => {
    fondo.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, state]);

  return (
    <>
      <div className="flex min-h-[320px] flex-col gap-3 pb-28">
        {aviso ? (
          <p className="self-center rounded-pill bg-line-100 px-3 py-1.5 text-[11px] font-semibold text-ink-500">
            {aviso}
          </p>
        ) : null}

        {messages.length === 0 ? (
          <p className="self-center py-10 text-center text-[13px] leading-relaxed text-ink-500">
            No hay mensajes todavía.
            <br />
            Escribe el primero.
          </p>
        ) : null}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-[3px] ${m.mio ? 'items-end' : 'items-start'}`}
          >
            <span className="px-1 text-[10.5px] font-bold text-ink-500">{m.autor}</span>
            <p
              className={`max-w-[80%] whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.mio
                  ? 'rounded-[16px_16px_5px_16px] bg-brand-600 text-white'
                  : 'rounded-[16px_16px_16px_5px] border border-line-100 bg-white text-navy-900'
              }`}
            >
              {m.body}
            </p>
            <span className="px-1 text-[10px] text-ink-500">{m.hora}</span>
          </div>
        ))}

        <div ref={fondo} />
      </div>

      <form
        ref={caja}
        action={action}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[0_-4px_18px_rgba(16,36,58,.06)] lg:sticky lg:bottom-4 lg:rounded-card lg:border"
      >
        <input type="hidden" name="conversationId" value={conversationId} />

        <div className="mx-auto flex max-w-5xl items-center gap-2.5">
          <label className="sr-only" htmlFor="mensaje">
            Mensaje
          </label>
          <input
            id="mensaje"
            name="body"
            autoComplete="off"
            placeholder="Escribe un mensaje…"
            className="h-11 min-w-0 flex-1 rounded-pill border border-line-200 bg-surface-50 px-4 text-[14px] text-navy-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/12"
          />
          <Enviar />
        </div>

        {state?.error ? (
          <p role="alert" className="mx-auto mt-2 max-w-5xl text-[12px] font-semibold text-danger-700">
            {state.error}
          </p>
        ) : null}
      </form>
    </>
  );
}

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Enviar mensaje"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:bg-line-300 disabled:text-ink-700"
    >
      <Icon name="enviar" size={19} />
    </button>
  );
}
