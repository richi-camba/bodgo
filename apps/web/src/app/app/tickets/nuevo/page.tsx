import type { Metadata } from 'next';
import { StepHeader } from '@/components/app/step-header';
import { NewTicketForm } from '@/components/app/new-ticket-form';

export const metadata: Metadata = { title: 'Nuevo ticket' };

export default function NewTicketPage() {
  return (
    <div>
      <StepHeader titulo="Abrir un ticket" volverA="/app/mensajes?tab=tickets" />
      <NewTicketForm />
    </div>
  );
}
