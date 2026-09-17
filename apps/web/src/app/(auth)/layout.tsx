import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { createClient } from '@/lib/supabase/server';

/**
 * Pantalla partida de acceso, como en el prototipo: la promesa a la
 * izquierda sobre la foto, el formulario a la derecha sobre blanco.
 *
 * Las tres cifras del panel salen de la red real. En el prototipo eran fijas
 * («128 SKUs gestionados»); acá, si la red está vacía, la columna muestra la
 * promesa sin cifras en vez de inventar un número que nadie puede comprobar.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.from('warehouse_listings').select('comuna, capacity_m3');

  const bodegas = data?.length ?? 0;
  const comunas = new Set((data ?? []).map((w) => w.comuna)).size;
  const capacidad = Math.round((data ?? []).reduce((s, w) => s + Number(w.capacity_m3 ?? 0), 0));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_1fr]">
      {/* ------------------------------------------------------- la promesa */}
      <aside className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image
          src="/fotos/pyme-despacho.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-[60%_20%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(150deg,rgb(9_23_40/0.94)_0%,rgb(15_39_66/0.88)_55%,rgb(22_54_90/0.78)_100%)]"
        />

        <Link href="/" aria-label="BodGo, ir al inicio" className="relative z-[2]">
          <Logo size={24} tone="light" />
        </Link>

        <div className="relative z-[2] max-w-[420px]">
          <span className="inline-block rounded-pill bg-white/[0.12] px-3 py-1.5 text-[11.5px] font-bold tracking-[0.06em] text-[#BBD2E8]">
            RED DE MICROBODEGAS
          </span>
          <h2 className="mt-5 text-[38px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
            Toda tu operación logística en una sola pantalla
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/70">
            Inventario, pedidos y despachos de todas tus microbodegas, con el detalle que la
            pantalla grande permite.
          </p>
        </div>

        {bodegas > 0 ? (
          <dl className="relative z-[2] flex gap-10">
            <PanelStat valor={String(bodegas)} label="bodegas activas" />
            <PanelStat valor={String(comunas)} label="comunas disponibles" />
            <PanelStat valor={`${capacidad} m³`} label="de capacidad publicada" />
          </dl>
        ) : (
          <span className="relative z-[2]" />
        )}
      </aside>

      {/* ----------------------------------------------------- el formulario */}
      <div className="flex min-h-screen flex-col bg-surface-50">
        <header className="px-5 py-6 lg:hidden">
          <Link href="/" aria-label="BodGo, ir al inicio">
            <Logo size={22} />
          </Link>
        </header>

        <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:pt-0 lg:px-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>

        <footer className="px-5 pb-8 text-center text-[11.5px] text-ink-400">
          Tamayaz SpA · Corfo Semilla Inicia 25INI2-312540
        </footer>
      </div>
    </div>
  );
}

function PanelStat({ valor, label }: { valor: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block text-[26px] font-extrabold leading-none tracking-[-0.5px] text-white">
          {valor}
        </span>
        <span className="mt-1 block text-[12.5px] text-white/60">{label}</span>
      </dd>
    </div>
  );
}
