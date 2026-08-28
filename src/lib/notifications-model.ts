export type NotificationType = 'insight' | 'task' | 'approval' | 'system' | 'billing';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export function unreadCount(notifications: Notification[]) {
  return notifications.filter((notification) => !notification.read).length;
}
