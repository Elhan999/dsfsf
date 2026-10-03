import { api, unwrap } from '@/lib/api';
import type { NotificationList } from '@/types/api';

export const notificationsService = {
  list: (page = 1, limit = 30) => api.get<NotificationList>('/notifications', { params: { page, limit } }).then((r) => r.data),
  unreadCount: () => unwrap<{ unreadCount: number }>(api.get('/notifications/unread-count')),
  markRead: (id: number) => unwrap<{ id: number; unreadCount: number }>(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap<{ unreadCount: number }>(api.patch('/notifications/read-all')),
};
