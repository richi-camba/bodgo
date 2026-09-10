import Link from 'next/link';
import { Avatar } from '@/components/app/shell';
import { Badge, type Tone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/stat';
import { LABELS } from '@bodgo/core';
import { reasonLabel } from '@/lib/comms';

export type ConvoRow = {
  id: string;
  nombre: string;
  iniciales: string;
  ultimo: string;
  cuando: string;
  sinLeer: boolean;
};

export type TicketRow = {
  id: string;
  code: string;
  subject: string;
  reason: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  cuando: string;
  /** Quién lo abrió. Sólo se muestra en la bandeja del equipo BodGo. */
  autor?: string;
};

const ESTADO: Record<string, Tone> = {
  open: 'warning',
  in_progress: 'brand',
  resolved: 'success',
};

/** Dos pestañas: conversaciones con la contraparte y tickets con BodGo. */
export function InboxTabs({
  base,
  activa,
  tickets,
}: {
  base: string;
  activa: 'chat' | 'tickets';
  /** Cuántos tickets abiertos, para el contador de la pestaña. */
  tickets: number;
}) {
  return (
    <div role="tablist" aria-label="Bandeja" className="flex gap-2">
      <Pestana href={base} activa={activa === 'chat'}>
        Conversaciones
      </Pestana>
      <Pestana href={`${base}?tab=tickets`} activa={activa === 'tickets'}>
        Tickets{tickets > 0 ? ` (${tickets})` : ''}
      </Pestana>
    </div>
  );
}

function Pestana({
  href,
  activa,
  children,
}: {
  href: string;
  activa: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={activa}
      className={`flex-1 rounded-[11px] p-2.5 text-center text-[13px] font-bold transition-colors ${
        activa
          ? 'bg-navy-800 text-white'
          : 'border border-line-200 bg-white text-ink-700 hover:border-navy-800'
      }`}
    >
      {children}
    </Link>
  );
}

export function ConversationList({ base, convos }: { base: string; convos: ConvoRow[] }) {
  if (!convos.length) {
    return (
      <EmptyState
        icon="mensajes"
        title="Aún no tienes conversaciones"
        body="Se abre una por bodega: escribe al bodeguero desde la ficha del espacio y el hilo queda acá."
      />
    );
  }

  return (
    <ul>
      {convos.map((c) => (
        <li key={c.id} className="border-b border-line-100 last:border-0">
          <Link href={`${base}/${c.id}`} className="flex items-center gap-3.5 px-2 py-3.5">
            <Avatar initials={c.iniciales} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-bold text-navy-900">{c.nombre}</span>
                <span className="shrink-0 text-[11px] text-ink-500">{c.cuando}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink-500">{c.ultimo}</span>
                {c.sinLeer ? (
                  <span
                    aria-label="Sin leer"
                    className="h-[9px] w-[9px] shrink-0 rounded-full bg-brand-600"
                  />
                ) : null}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TicketList({
  base,
  tickets,
  vacio,
}: {
  base: string;
  tickets: TicketRow[];
  vacio: string;
}) {
  if (!tickets.length) {
    return <EmptyState icon="tickets" title="No hay tickets abiertos" body={vacio} />;
  }

  return (
    <ul className="space-y-2.5">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`${base}/${t.id}`}
            className="block rounded-[14px] border border-line-100 bg-white p-3.5 transition-colors hover:border-navy-800"
          >
            <div className="flex items-center justify-between gap-2.5">
              <span className="font-mono text-[12px] font-bold text-ink-500">{t.code}</span>
              <Badge tone={ESTADO[t.status] ?? 'neutral'}>{LABELS.ticketStatus[t.status]}</Badge>
            </div>
            <p className="mt-2 text-[14px] font-bold text-navy-900">{t.subject}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-500">
              {reasonLabel(t.reason)} · {t.cuando}
              {t.autor ? ` · ${t.autor}` : ''}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Botón de «abrir ticket» al pie de la lista. */
export function NewTicketLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-line-300 bg-white p-3.5 text-[14px] font-bold text-brand-600 transition-colors hover:border-brand-600"
    >
      <Icon name="agregar" size={16} />
      Abrir un ticket con BodGo
    </Link>
  );
}
