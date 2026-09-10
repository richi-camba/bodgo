'use client';

import { useId, useState } from 'react';
import { Icon } from '@/components/ui/icon';

type Props = {
  /** Nombre del campo oculto que lleva la ruta al servidor. */
  name: string;
  /** Rótulo sobre el recuadro. Se omite si el título de la pantalla ya lo dice. */
  label?: string;
  hint?: string;
  /** Carpeta dentro del bucket privado, después del id del usuario. */
  folder: string;
  /** Avisa la ruta subida, para flujos por pasos que necesitan saberlo. */
  onSubido?: (ruta: string) => void;
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
export function PhotoCapture({ name, label, hint, folder, onSubido }: Props) {
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
    onSubido?.(target);
  }

  return (
    <div>
      <input type="hidden" name={name} value={path} />

      {label ? <p className="mb-2 text-[12.5px] font-bold text-ink-700">{label}</p> : null}

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
              onSubido?.('');
            }}
            className="text-[12px] font-bold text-ink-500 hover:text-danger-700 hover:underline"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-line-300 bg-white px-4 py-8 text-center transition-colors hover:border-brand-600"
        >
          <span className="text-brand-600">
            <Icon name="camara" size={28} />
          </span>
          <span className="text-[14px] font-extrabold text-navy-900">
            {status === 'uploading' ? 'Subiendo…' : 'Tomar o subir foto'}
          </span>
          {hint ? <span className="text-[12px] text-ink-500">{hint}</span> : null}
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
        <p role="alert" className="mt-2 text-[12.5px] font-semibold text-danger-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
