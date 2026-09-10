import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Avatar } from '@/components/app/shell';
import { StepHeader } from '@/components/app/step-header';
import { MessageThread } from '@/components/app/message-thread';
import { loadConversation } from '@/lib/inbox';
import { markConversationRead } from '@/app/comms/actions';

export const metadata: Metadata = { title: 'Conversación' };

export default async function PymeThread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const convo = await loadConversation(id, 'pyme');
  if (!convo) notFound();

  // Abrir el hilo es haberlo leído: si no se marcara acá, el punto azul de
  // la bandeja seguiría encendido después de leerlo.
  await markConversationRead(id);

  return (
    <div>
      <StepHeader
        titulo={convo.titulo}
        subtitulo={[convo.contraparte, convo.comuna].filter(Boolean).join(' · ')}
        volverA="/app/mensajes"
        accion={<Avatar initials={convo.iniciales} size={42} />}
      />

      <MessageThread
        conversationId={convo.id}
        messages={convo.mensajes}
        aviso={convo.comuna ? `Sobre la bodega de ${convo.comuna}` : undefined}
      />
    </div>
  );
}
