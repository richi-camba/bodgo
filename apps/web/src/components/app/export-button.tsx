'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/icon';

export type Fila = Record<string, string | number>;

/**
 * Exportar el reporte a CSV.
 *
 * El archivo se arma en el navegador con los mismos datos que están en
 * pantalla: no hay una segunda consulta que pueda devolver otra cosa, y lo
 * que se descarga es exactamente lo que se está mirando.
 *
 * Va con BOM y con punto y coma: Excel en español abre así el archivo en
 * columnas. Con coma mete todo en la primera celda.
 */
export function ExportButton({
  filas,
  nombre,
  unidad = 'pedido',
  unidadPlural = 'pedidos',
}: {
  filas: Fila[];
  nombre: string;
  /** Qué es cada fila, para la nota bajo el botón. */
  unidad?: string;
  unidadPlural?: string;
}) {
  const [listo, setListo] = useState(false);

  function exportar() {
    if (!filas.length) return;

    const columnas = Object.keys(filas[0]!);
    const escapar = (v: string | number) => {
      const s = String(v);
      return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };

    const csv = [
      columnas.join(';'),
      ...filas.map((f) => columnas.map((c) => escapar(f[c] ?? '')).join(';')),
    ].join('\r\n');

    const url = URL.createObjectURL(
      new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }),
    );

    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setListo(true);
    setTimeout(() => setListo(false), 3000);
  }

  return (
    <div>
      <button
        type="button"
        onClick={exportar}
        disabled={!filas.length}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-brand-600 bg-white p-3.5 text-[14px] font-bold text-brand-600 transition-colors hover:bg-brand-50 disabled:border-line-200 disabled:text-ink-400 disabled:hover:bg-white"
      >
        <Icon name="exportar" size={17} />
        Exportar reporte
      </button>

      <p role="status" className="mt-2 text-center text-[11.5px] text-ink-500">
        {listo
          ? 'Descargado. Se abre en Excel o Google Sheets.'
          : filas.length
            ? `${filas.length} ${filas.length === 1 ? unidad : unidadPlural} en CSV.`
            : 'Nada que exportar todavía.'}
      </p>
    </div>
  );
}
