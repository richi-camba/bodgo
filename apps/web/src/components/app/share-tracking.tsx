'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';

/**
 * Enlace de seguimiento para el comprador.
 *
 * El prototipo prometía mandarlo por correo y WhatsApp al guardarlo. Sin un
 * proveedor de correo contratado, mandarlo solo sería mentira: acá se copia o
 * se abre WhatsApp con el mensaje ya escrito, que es lo que hoy funciona de
 * verdad.
 */
export function ShareTracking({
  url,
  buyerName,
  buyerPhone,
  orderCode,
}: {
  url: string;
  buyerName: string;
  buyerPhone: string | null;
  orderCode: string;
}) {
  const [copied, setCopied] = useState(false);

  const message = `Hola ${buyerName.split(' ')[0]}, tu pedido ${orderCode} ya va en camino. Puedes seguirlo acá: ${url}`;
  const digits = buyerPhone?.replace(/\D/g, '') ?? '';
  const whatsapp = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="card p-5">
      <h2 className="text-[15px] font-extrabold text-navy-900">Seguimiento del comprador</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
        Este enlace muestra el estado del pedido sin pedir cuenta. Sólo lo abre quien lo tenga.
      </p>

      <p className="mt-4 truncate rounded-field bg-surface-50 px-3.5 py-3 font-mono text-[12px] text-ink-700">
        {url}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 rounded-field border border-line-200 px-4 py-2.5 text-[13px] font-bold text-navy-800 transition-colors hover:border-navy-800"
        >
          <Icon name={copied ? 'listo' : 'contratos'} size={15} />
          {copied ? 'Copiado' : 'Copiar enlace'}
        </button>

        {digits.length >= 8 ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-field border border-line-200 px-4 py-2.5 text-[13px] font-bold text-navy-800 transition-colors hover:border-navy-800"
          >
            <Icon name="telefono" size={15} />
            Enviar por WhatsApp
          </a>
        ) : null}
      </div>
    </section>
  );
}
