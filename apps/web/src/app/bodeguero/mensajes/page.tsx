import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/stat';
import { ConversationList, InboxTabs, NewTicketLink, TicketList } from '@/components/app/inbox';
import { loadInbox } from '@/lib/inbox';

export const metadata: Metadata = { title: 'Mensajes' };

export default async function HostInbox({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activa = tab === 'tickets' ? 'tickets' : 'chat';
  const { convos, tickets } = await loadInbox("bodeguero");

  return (
    <div className="space-y-4">
      <PageHeader title="Mensajes" subtitle="Chat con tus PyMEs y soporte de BodGo" />

      <InboxTabs
        base="/bodeguero/mensajes"
        activa={activa}
        tickets={tickets.filter((t) => t.status !== 'resolved').length}
      />

      {activa === 'chat' ? (
        <ConversationList base="/bodeguero/mensajes" convos={convos} />
      ) : (
        <>
          <TicketList
            base="/bodeguero/tickets"
            tickets={tickets}
            vacio="Si algo no cuadra con una recepción, una liquidación o tu espacio, abre un ticket y el equipo lo toma."
          />
          <NewTicketLink href="/bodeguero/tickets/nuevo" />
        </>
      )}
    </div>
  );
}
