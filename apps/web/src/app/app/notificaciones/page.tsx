import type { Metadata } from 'next';
import { NotificationsList } from '@/components/app/notifications-list';

export const metadata: Metadata = { title: 'Notificaciones' };

export default function PymeNotificationsPage() {
  return <NotificationsList />;
}
