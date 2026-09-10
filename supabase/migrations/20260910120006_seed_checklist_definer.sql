-- -----------------------------------------------------------------------------
-- El trigger que crea el checklist tiene que poder escribir.
--
-- `seed_warehouse_checklist()` corría con los permisos del bodeguero, y
-- `warehouse_checklist` sólo acepta SELECT del dueño y UPDATE del admin:
-- nadie puede insertar. Resultado: publicar una microbodega fallaba con
-- «new row violates row-level security policy», y no se podía dar de alta un
-- espacio desde la aplicación. No se veía porque el seed escribe con la clave
-- de servicio, que salta RLS.
--
-- Pasa a SECURITY DEFINER, como el de las conversaciones: la lista de
-- verificación la define BodGo, no quien publica, y por eso mismo el
-- bodeguero no debe poder insertarla ni cambiarla a mano.
-- -----------------------------------------------------------------------------
create or replace function public.seed_warehouse_checklist() returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
begin
  insert into public.warehouse_checklist (warehouse_id, item, hint) values
    (new.id, 'Acceso independiente',   'Se puede entrar sin pasar por espacios privados'),
    (new.id, 'Superficie despejada',   'Piso libre, sin humedad ni filtraciones'),
    (new.id, 'Extintor vigente',       'Con carga al día y a la vista'),
    (new.id, 'Cierre seguro',          'Puerta con llave o candado propio'),
    (new.id, 'Documento del espacio',  'Certificado de dominio o contrato de arriendo')
  on conflict do nothing;
  return new;
end;
$$;

comment on function public.seed_warehouse_checklist is
  'Crea la lista de habilitación al publicar un espacio. SECURITY DEFINER porque warehouse_checklist no acepta INSERT de nadie: la define BodGo.';
