-- =============================================================================
-- BodGo · buckets de archivos.
--
-- Convención de rutas: `<uid>/<resto>`. La primera carpeta es el id del usuario
-- que sube, y las políticas la comparan contra auth.uid(). Así nadie puede
-- escribir ni pisar archivos de otro.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('warehouse-photos', 'warehouse-photos', true,  10485760, array['image/jpeg','image/png','image/webp']),
  ('product-photos',   'product-photos',   true,   5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars',          'avatars',          true,   2097152, array['image/jpeg','image/png','image/webp']),
  ('evidence',         'evidence',         false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Buckets públicos: lectura abierta, escritura sólo en la carpeta propia.
-- -----------------------------------------------------------------------------
create policy "lectura pública de imágenes" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('warehouse-photos', 'product-photos', 'avatars'));

create policy "subo a mi carpeta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('warehouse-photos', 'product-photos', 'avatars', 'evidence')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "reemplazo lo mío" on storage.objects
  for update to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text)
  with check ((storage.foldername(name))[1] = auth.uid()::text);

create policy "borro lo mío" on storage.objects
  for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);

-- -----------------------------------------------------------------------------
-- `evidence` es privado: fotos de recepción, comprobantes de courier, respaldos
-- de discrepancias. El que sube lo lee directo; la contraparte lo ve por URL
-- firmada que emite el servidor tras verificar que es parte de la operación.
-- -----------------------------------------------------------------------------
create policy "leo mi evidencia" on storage.objects
  for select to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
