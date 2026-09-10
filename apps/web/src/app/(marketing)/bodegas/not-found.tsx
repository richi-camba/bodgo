import { ButtonLink } from '@/components/ui/button';

/**
 * Cuando una ficha de microbodega ya no existe.
 *
 * Pasa de verdad: un bodeguero pausa su espacio y el enlace que alguien
 * guardó deja de resolver. Conviene ofrecerle el buscador, no una pared.
 */
export default function WarehouseNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="text-eyebrow">No encontramos esta microbodega</p>
      <h1 className="mt-3 text-[30px] font-extrabold leading-tight tracking-[-0.025em] text-navy-900 md:text-[36px]">
        Puede que ya no esté publicada
      </h1>
      <p className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-500">
        Los bodegueros pueden pausar su espacio cuando se les llena. Mira las que sí están
        disponibles ahora: la red cambia cada semana.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/bodegas" size="lg">
          Ver microbodegas disponibles
        </ButtonLink>
        <ButtonLink href="/#contacto" size="lg" variant="secondary">
          Avísenme cuando abran cerca
        </ButtonLink>
      </div>
    </div>
  );
}
