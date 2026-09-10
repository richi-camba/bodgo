'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';

/**
 * Menú de la web pública en pantallas chicas.
 *
 * Antes los enlaces simplemente desaparecían bajo los 768 px y no había con
 * qué reemplazarlos: desde el teléfono no se podía llegar a «Cómo funciona» ni
 * a «Precios».
 */
export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  // Con el panel abierto la página de atrás no debería moverse.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape cierra, como cualquier capa modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="menu-movil"
        className="flex h-10 w-10 items-center justify-center rounded-field text-navy-800 transition-colors hover:bg-surface-50"
      >
        <Icon name={open ? 'cerrar' : 'menu'} size={20} label={open ? 'Cerrar menú' : 'Abrir menú'} />
      </button>

      {open ? (
        <div
          id="menu-movil"
          className="fixed inset-x-0 top-16 z-50 border-b border-line-100 bg-white shadow-lift"
        >
          <nav aria-label="Principal" className="px-5 py-3">
            <ul className="divide-y divide-line-100">
              {links.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-3.5 text-[15px] font-bold text-navy-900"
                  >
                    {item.label}
                    <Icon name="siguiente" size={17} className="text-ink-400" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex gap-2 py-4">
              <Link
                href="/ingresar"
                onClick={() => setOpen(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-field border border-line-200 text-[14px] font-bold text-navy-800"
              >
                Ingresar
              </Link>
              <Link
                href="/registro"
                onClick={() => setOpen(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-field bg-navy-800 text-[14px] font-bold text-white"
              >
                Empieza gratis
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
