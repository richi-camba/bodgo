-- -----------------------------------------------------------------------------
-- El trigger que ordena la bandeja tiene que poder escribir.
--
-- `touch_conversation()` corría con los permisos de quien manda el mensaje, y
-- `conversations` no tiene política de UPDATE para nadie: el update afectaba
-- cero filas, en silencio. Resultado: `last_message_at` se quedaba en el
-- valor que hubiera dejado el seed, la bandeja ordenaba mal y la fecha de
-- cada hilo mentía. Sólo se notaba con usuarios reales, porque el seed
-- escribe con la clave de servicio y salta RLS.
--
-- Pasa a SECURITY DEFINER: es contabilidad del sistema, no una intención del
-- usuario. El `search_path` va fijo para que un esquema puesto por delante no
-- pueda secuestrar la función.
-- -----------------------------------------------------------------------------
create or replace function public.touch_conversation() returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return null;
end;
$$;

comment on function public.touch_conversation is
  'Mantiene conversations.last_message_at al insertar un mensaje. SECURITY DEFINER porque conversations no acepta UPDATE de los usuarios.';
