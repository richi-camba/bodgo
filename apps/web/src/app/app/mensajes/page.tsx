import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/stat';
import { ConversationList, InboxTabs, NewTicketLink, TicketList } from '@/components/app/inbox';
import { loadInbox } from '@/lib/inbox';

export const metadata: Metadata = { title: 'Mensajes' };

export default async function PymeInbox({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activa = tab === 'tickets' ? 'tickets' : 'chat';
  const { convos, tickets } = await loadInbox('pyme');

  return (
    <div className="space-y-4">
      <PageHeader title="Mensajes" subtitle="Chat con bodegueros y soporte de BodGo" />

      <InboxTabs
        base="/app/mensajes"
        activa={activa}
        tickets={tickets.filter((t) => t.status !== 'resolved').length}
      />

      {activa === 'chat' ? (
        <ConversationList base="/app/mensajes" convos={convos} />
      ) : (
        <>
          <TicketList
            base="/app/tickets"
            tickets={tickets}
            vacio="Si algo no cuadra con una recepción, un cobro o tu cuenta, abre un ticket y el equipo lo toma."
          />
          <NewTicketLink href="/app/tickets/nuevo" />
        </>
      )}
    </div>
  );
}
