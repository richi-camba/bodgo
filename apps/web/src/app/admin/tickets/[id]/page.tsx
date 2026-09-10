import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, type Tone } from '@/components/ui/badge';
import { StepHeader } from '@/components/app/step-header';
import { TicketStatusControl, TicketThread } from '@/components/app/ticket-thread';
import { loadTicket } from '@/lib/ticket';
import { reasonLabel } from '@/lib/comms';
import { LABELS } from '@bodgo/core';

export const metadata: Metadata = { title: 'Ticket' };

const ESTADO: Record<string, Tone> = {
  open: 'warning',
  in_progress: 'brand',
  resolved: 'success',
};

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = await loadTicket(id);
  if (!ticket) notFound();

  return (
    <div className="space-y-4">
      <StepHeader
        titulo={ticket.subject}
        subtitulo={
          <span>
            <span className="font-mono">{ticket.code}</span> · {reasonLabel(ticket.reason)} ·{' '}
            {ticket.abiertoPor}
          </span>
        }
        volverA="/admin/tickets"
        tomaLaPantalla={false}
        accion={
          <Badge tone={ESTADO[ticket.status] ?? 'neutral'}>{LABELS.ticketStatus[ticket.status]}</Badge>
        }
      />

      <TicketStatusControl ticketId={ticket.id} status={ticket.status} />

      <TicketThread
        ticketId={ticket.id}
        notes={ticket.notes}
        cerrado={ticket.status === 'resolved'}
      />
    </div>
  );
}
