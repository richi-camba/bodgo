import type { ReactNode } from 'react';

/**
 * Armazón de las páginas legales.
 *
 * NOTA PARA EL EQUIPO: el contenido de Términos y de Privacidad describe con
 * precisión cómo funciona la plataforma, pero NO fue revisado por un abogado.
 * Antes de abrir el registro a usuarios reales tiene que pasar por revisión
 * legal en Chile — la Ley 19.628 y la 21.719 imponen obligaciones concretas
 * sobre tratamiento de datos que conviene verificar con alguien habilitado.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <p className="text-eyebrow">Legal</p>
      <h1 className="mt-3 text-[34px] font-extrabold leading-tight tracking-[-0.025em] text-navy-900 md:text-[42px]">
        {title}
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">{intro}</p>
      <p className="mt-4 text-[12.5px] text-ink-400">Última actualización: {updated}</p>

      <div className="mt-10 space-y-9">{children}</div>

      <footer className="mt-14 rounded-card bg-surface-50 p-6">
        <p className="text-[13.5px] leading-relaxed text-ink-700">
          ¿Dudas sobre este documento? Escríbenos a{' '}
          <a href="mailto:hola@bodgo.cl" className="font-bold text-brand-600 hover:underline">
            hola@bodgo.cl
          </a>
          . Responde una persona, no un formulario.
        </p>
      </footer>
    </article>
  );
}

export function Clause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[19px] font-extrabold tracking-tight text-navy-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-700">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
