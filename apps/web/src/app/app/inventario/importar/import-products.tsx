'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { importProducts, type ActionState } from '@/app/app/actions';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  CSV_MAX_BYTES,
  CSV_MAX_ROWS,
  CSV_TEMPLATE,
  csvSummary,
  formatNumber,
  parseProductCsv,
  type CsvRow,
} from '@bodgo/core';

/**
 * Carga masiva del catálogo.
 *
 * Tres pasos, como en el prototipo: elegir el archivo, revisar fila por fila
 * y confirmar. La revisión se arma en el navegador con el mismo parser que
 * después corre el servidor, así que lo que se ve es lo que se va a guardar.
 *
 * El prototipo pide también `stock` y `bodega`. Acá no: las unidades las
 * mueven las recepciones y los pedidos, y dejar que un CSV las escriba
 * rompería la trazabilidad y la conciliación contra el conteo físico. Si el
 * archivo trae esas columnas, la revisión avisa que se ignoran.
 */
export function ImportProducts({ skusExistentes }: { skusExistentes: string[] }) {
  const [texto, setTexto] = useState('');
  const [nombre, setNombre] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [state, action] = useActionState<ActionState, FormData>(importProducts, null);
  const input = useRef<HTMLInputElement>(null);

  const lectura = texto ? parseProductCsv(texto, { skusExistentes }) : null;
  const resumen = lectura ? csvSummary(lectura.filas) : null;

  async function elegir(file: File) {
    setAviso(null);

    if (file.size > CSV_MAX_BYTES) {
      setAviso('El archivo pesa más de 2 MB. Pártelo en varios.');
      return;
    }

    setTexto(await file.text());
    setNombre(file.name);
  }

  function descargarPlantilla() {
    const url = URL.createObjectURL(
      new Blob(['﻿' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bodgo-plantilla-catalogo.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ------------------------------------------------------------ resultado
  if (state?.ok) {
    return (
      <div className="pt-2 text-center">
        <span
          aria-hidden
          className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-success-50 text-success-700"
        >
          <Icon name="listo" size={34} />
        </span>
        <h2 className="mt-4 text-[19px] font-extrabold tracking-tight text-navy-900">
          Catálogo actualizado
        </h2>
        <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed text-ink-500">
          {state.ok}
        </p>
        <div className="mt-5">
          <Link
            href="/app/inventario"
            className="block rounded-[14px] bg-navy-800 p-3.5 text-[15px] font-bold text-white transition-colors hover:bg-navy-950"
          >
            Ver inventario
          </Link>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- elección
  if (!lectura) {
    return (
      <div>
        <p className="text-[13px] leading-relaxed text-ink-500">
          Sube un CSV con tus productos y los damos de alta de una sola vez.
        </p>

        <label
          htmlFor="csv"
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[16px] border-[1.5px] border-dashed border-line-300 bg-white px-4 py-7 text-center transition-colors hover:border-brand-600"
        >
          <span className="text-brand-600">
            <Icon name="exportar" size={30} className="rotate-180" />
          </span>
          <span className="mt-3 text-[14px] font-extrabold text-navy-900">Elegir archivo CSV</span>
          <span className="mt-1 text-[11.5px] text-ink-500">
            Hasta {CSV_MAX_ROWS} filas · máximo 2 MB
          </span>
        </label>

        <input
          ref={input}
          id="csv"
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void elegir(file);
          }}
        />

        {aviso ? (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-danger-700">
            {aviso}
          </p>
        ) : null}

        <h2 className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[.04em] text-ink-500">
          Columnas del archivo
        </h2>
        <div className="rounded-[14px] border border-line-100 bg-surface-25 p-4 text-[12.5px] leading-relaxed text-ink-700">
          <p className="font-mono">nombre · sku · categoria · volumen_m3 · stock_objetivo</p>
          <p className="mt-2.5 text-[12px] text-ink-500">
            Sólo <strong className="font-bold text-navy-900">nombre</strong> y{' '}
            <strong className="font-bold text-navy-900">sku</strong> son obligatorias. Sirve el
            punto y coma de Excel en español y la coma decimal.
          </p>
          <p className="mt-2 text-[12px] text-ink-500">
            No se importa stock: las unidades las mueven las recepciones y los pedidos.
          </p>
        </div>

        <button
          type="button"
          onClick={descargarPlantilla}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[13px] border-[1.5px] border-line-200 bg-white p-3.5 text-[13.5px] font-bold text-navy-800 transition-colors hover:border-navy-800"
        >
          <Icon name="exportar" size={16} />
          Descargar plantilla
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------- revisión
  return (
    <form action={action} className="pb-28">
      <input type="hidden" name="csv" value={texto} />

      <h2 className="text-[19px] font-extrabold tracking-tight text-navy-900">Revisa la carga</h2>

      <div className="mt-3 flex items-center gap-2.5 rounded-[13px] border border-line-100 bg-surface-25 p-3.5">
        <span aria-hidden className="shrink-0 text-brand-600">
          <Icon name="contratos" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-navy-900">{nombre}</p>
          <p className="mt-0.5 text-[11px] text-ink-500">
            {lectura.error
              ? 'No se pudo leer'
              : `${formatNumber(lectura.filas.length)} ${lectura.filas.length === 1 ? 'fila' : 'filas'} · ${formatNumber(resumen!.importables)} ${resumen!.importables === 1 ? 'lista' : 'listas'} para importar`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTexto('');
            setNombre('');
            if (input.current) input.current.value = '';
          }}
          className="shrink-0 text-[12px] font-bold text-brand-600 hover:underline"
        >
          Cambiar
        </button>
      </div>

      {lectura.error ? (
        <p role="alert" className="mt-4 rounded-[12px] bg-danger-50 p-3.5 text-[12.5px] leading-relaxed text-danger-700">
          {lectura.error}
        </p>
      ) : null}

      {lectura.ignoradas.length ? (
        <p className="mt-3 rounded-[12px] bg-warning-50 p-3 text-[12px] leading-relaxed text-warning-700">
          Se ignoran las columnas{' '}
          <span className="font-mono font-bold">{lectura.ignoradas.join(', ')}</span>.
          {lectura.ignoradas.includes('stock') || lectura.ignoradas.includes('bodega')
            ? ' El stock entra por las recepciones, no por el archivo.'
            : ''}
        </p>
      ) : null}

      {lectura.filas.length ? (
        <ul className="mt-3.5 space-y-2.5">
          {lectura.filas.map((f) => (
            <Fila key={`${f.linea}-${f.sku}`} fila={f} />
          ))}
        </ul>
      ) : null}

      {state?.error ? (
        <p role="alert" className="mt-4 rounded-[12px] bg-danger-50 p-3.5 text-[12.5px] font-semibold text-danger-700">
          {state.error}
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3.5 shadow-[0_-4px_18px_rgba(16,36,58,.06)] lg:sticky lg:bottom-4 lg:mt-6 lg:rounded-card lg:border lg:pb-3.5">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            href="/app/inventario"
            className="rounded-field border border-line-200 bg-white px-5 py-3 text-[15px] font-bold text-navy-800 transition-colors hover:border-navy-800"
          >
            Volver
          </Link>
          <div className="flex-1">
            <Importar total={resumen?.importables ?? 0} />
          </div>
        </div>
      </div>
    </form>
  );
}

function Fila({ fila }: { fila: CsvRow }) {
  const tono =
    fila.estado === 'error'
      ? 'bg-danger-50 text-danger-700'
      : fila.estado === 'actualiza'
        ? 'bg-warning-50 text-warning-700'
        : 'bg-success-50 text-success-700';

  const etiqueta =
    fila.estado === 'error' ? 'Fuera' : fila.estado === 'actualiza' ? 'Actualiza' : 'Nuevo';

  return (
    <li className="flex items-center gap-3 rounded-[14px] border border-line-100 bg-white p-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-navy-900">
          {fila.name || <span className="text-ink-500">(sin nombre)</span>}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-ink-500">
          <span className="font-mono">{fila.sku || '—'}</span>
          {fila.category ? ` · ${fila.category}` : ''} ·{' '}
          {formatNumber(fila.unitVolumeM3 * 1000, 1)} L/u
          {fila.targetStock ? ` · objetivo ${formatNumber(fila.targetStock)}` : ''}
        </p>
        {fila.motivo ? (
          <p
            className={`mt-1 text-[11px] font-semibold ${
              fila.estado === 'error' ? 'text-danger-700' : 'text-ink-500'
            }`}
          >
            Línea {fila.linea} · {fila.motivo}
          </p>
        ) : null}
      </div>
      <span className={`shrink-0 rounded-[7px] px-2 py-1 text-[10px] font-bold ${tono}`}>
        {etiqueta}
      </span>
    </li>
  );
}

function Importar({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending || total === 0}>
      {pending ? 'Importando…' : total === 0 ? 'Nada que importar' : `Importar ${total}`}
    </Button>
  );
}
