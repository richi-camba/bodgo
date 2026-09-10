import Image from 'next/image';
import Link from 'next/link';

/**
 * Tarjeta promocional de la portada, con foto de fondo.
 *
 * Medidas del prototipo: cápsula de 10px, titular de 20px en dos líneas,
 * bajada al 78% de blanco y botón blanco de esquinas 11px.
 */
export function PromoCard() {
  return (
    <section className="relative overflow-hidden rounded-[20px] bg-navy-800">
      <Image
        src="/fotos/pyme-despacho.jpg"
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 640px"
        className="object-cover object-[75%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/92 to-navy-950/35" />

      <div className="relative p-5">
        <span className="inline-block rounded-pill bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-400">
          Para PyMEs
        </span>

        <h2 className="mt-3 max-w-[16ch] text-[20px] font-extrabold leading-[1.15] text-white">
          Acerca tu stock a tus clientes
        </h2>
        <p className="mt-2 max-w-[34ch] text-[13px] leading-relaxed text-white/80">
          Contrata una microbodega cerca de tu demanda y despacha más rápido, sin bodega propia.
        </p>

        <Link
          href="/app/buscar"
          className="mt-4 inline-flex h-8 items-center rounded-[11px] bg-white px-4 text-[13px] font-bold text-navy-800 transition-colors hover:bg-white/90"
        >
          Buscar microbodega
        </Link>
      </div>
    </section>
  );
}
