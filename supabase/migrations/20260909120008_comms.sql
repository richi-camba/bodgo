-- =============================================================================
-- BodGo · conversaciones, tickets, notificaciones e incidentes.
-- =============================================================================

create table public.conversations (
  id             uuid primary key default gen_random_uuid(),
  pyme_id        uuid not null references public.profiles (id) on delete cascade,
  bodeguero_id   uuid not null references public.profiles (id) on delete cascade,
  warehouse_id   uuid references public.warehouses (id) on delete set null,
  last_message_at timestamptz,
  created_at     timestamptz not null default now()
);

-- Una conversación por par y bodega. El índice parcial cubre el caso sin
-- bodega asociada, donde el UNIQUE normal no serviría por los NULL.
create unique index conversations_triple_idx
  on public.conversations (pyme_id, bodeguero_id, warehouse_id)
  where warehouse_id is not null;
create unique index conversations_pair_idx
  on public.conversations (pyme_id, bodeguero_id)
  where warehouse_id is null;

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text,
  kind            text not null default 'text' check (kind in ('text', 'audio', 'video', 'image')),
  media_url       text,
  duration_seconds integer,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  constraint messages_have_content check (kind = 'text' and body is not null or kind <> 'text' and media_url is not null)
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

create or replace function public.touch_conversation() returns trigger
  language plpgsql as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return null;
end;
$$;

create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation();

-- -----------------------------------------------------------------------------
-- Tickets de soporte abiertos por PyMEs o bodegueros.
-- -----------------------------------------------------------------------------
create table public.tickets (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique default ('TIX-' || nextval('public.ticket_code_seq')),
  opened_by    uuid not null references public.profiles (id) on delete cascade,
  subject      text not null,
  reason       text,
  status       public.ticket_status not null default 'open',
  related_type text,
  related_id   uuid,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create index tickets_opened_by_idx on public.tickets (opened_by, status);

create table public.ticket_notes (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index ticket_notes_ticket_idx on public.ticket_notes (ticket_id, created_at);

-- -----------------------------------------------------------------------------
-- Notificaciones in-app. El envío por push/correo lo hace un worker aparte;
-- acá queda el registro que ve el usuario en la campanita.
-- -----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

/**
 * Inserta una notificación respetando las preferencias del destinatario.
 *
 * `always` fuerza el aviso aunque el usuario tenga todo apagado: se usa para
 * pagos y recepciones, que según el producto siempre se avisan.
 */
create or replace function public.notify(
  target uuid, kind text, title text, body text default null,
  link text default null, always boolean default false
) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  wants boolean;
  new_id uuid;
begin
  select (p.push or p.email) into wants
  from public.notification_preferences p where p.profile_id = target;

  if not always and coalesce(wants, true) = false then
    return null;
  end if;

  insert into public.notifications (user_id, kind, title, body, link)
  values (target, kind, title, body, link)
  returning id into new_id;

  return new_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Incidentes de red (backoffice).
-- -----------------------------------------------------------------------------
create table public.incidents (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique default ('INC-' || nextval('public.incident_code_seq')),
  title        text not null,
  severity     public.incident_severity not null default 'medium',
  status       public.incident_status not null default 'open',
  warehouse_id uuid references public.warehouses (id) on delete set null,
  pyme_id      uuid references public.profiles (id) on delete set null,
  related_type text,
  related_id   uuid,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create index incidents_status_idx on public.incidents (status, severity);

create table public.incident_notes (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Captación desde la web pública. Es la única tabla donde escribe un anónimo.
-- -----------------------------------------------------------------------------
create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null,
  name          text,
  role_interest public.user_role not null default 'pyme',
  comuna        text,
  message       text,
  source        text,
  created_at    timestamptz not null default now()
);

create index leads_created_idx on public.leads (created_at desc);
