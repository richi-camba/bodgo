'use client';

import { useState } from 'react';
import type { Pregunta } from './faq-content';

export function Faq({ preguntas }: { preguntas: Pregunta[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      <ul className="divide-y divide-line-100 border-y border-line-100">
        {preguntas.map((item, i) => {
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
