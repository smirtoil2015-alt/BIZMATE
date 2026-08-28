import type { Notification } from '@/lib/notifications-model';

export function notificationsForUser(notifications: Notification[], userId: string) {
  return notifications
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markNotificationRead(notification: Notification): Notification {
  return { ...notification, read: true };
}
