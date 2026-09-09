'use client';

import { useId, useState } from 'react';

type Props = {
  /** Nombre del campo oculto que lleva la ruta al servidor. */
  name: string;
  label: string;
  hint?: string;
  /** Carpeta dentro del bucket privado, después del id del usuario. */
  folder: string;
};

/**
 * Captura y sube una foto de respaldo.
 *
 * En el teléfono abre la cámara directamente (`capture="environment"`). El
 * archivo va al bucket privado `evidence`, bajo la carpeta del propio usuario:
 * las políticas de storage sólo dejan escribir ahí. Al servidor viaja la ruta,
 * no el archivo — así una foto de varios megas no pasa por la función.
 *
 * El SDK de Supabase se importa recién al subir. Son unos 70 kB que no tienen
 * por qué viajar en la carga inicial de una pantalla que un repartidor abre
 * con datos móviles y sin saber todavía si va a sacar una foto.
 */
export function PhotoCapture({ name, label, hint, folder }: Props) {
  const inputId = useId();
  const [path, setPath] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function upload(file: File) {
    setStatus('uploading');
    setMessage(null);

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setStatus('error');
      setMessage('Tu sesión expiró. Vuelve a entrar.');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const target = `${user.id}/${folder}/${Date.now()}.${extension}`;

    const { error } = await supabase.storage.from('evidence').upload(target, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      setStatus('error');
      setMessage('No se pudo subir la foto. Revisa la señal e inténtalo de nuevo.');
      return;
    }

    setPath(target);
    setPreview(URL.createObjectURL(file));
    setStatus('idle');
  }

  return (
    <div>
      <input type="hidden" name={name} value={path} />

      <p className="mb-2 text-[12.5px] font-bold text-ink-700">{label}</p>

      {preview ? (
        <div className="flex items-center gap-3 rounded-field border border-success-600/30 bg-success-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Foto tomada" className="h-16 w-16 rounded-[10px] object-cover" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-success-700">Foto lista</p>
            <p className="text-[11.5px] text-ink-500">Se adjunta al confirmar.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPath('');
              setPreview(null);
            }}
            className="text-[12px] font-bold text-ink-500 hover:text-danger-600 hover:underline"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-field border-2 border-dashed border-line-300 bg-surface-25 px-4 py-7 text-center transition-colors hover:border-navy-800"
        >
          <span aria-hidden className="text-[22px]">
            📷
          </span>
          <span className="text-[13.5px] font-bold text-navy-900">
            {status === 'uploading' ? 'Subiendo…' : 'Tomar o subir foto'}
          </span>
          {hint ? <span className="text-[11.5px] text-ink-400">{hint}</span> : null}
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={status === 'uploading'}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {message ? (
        <p role="alert" className="mt-2 text-[12.5px] font-semibold text-danger-600">
          {message}
        </p>
      ) : null}
    </div>
  );
}
