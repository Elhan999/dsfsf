'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { notificationsService } from '@/services/notifications.service';
import type { NotificationList } from '@/types/api';
import { useAuth } from './useAuth';

export function useNotifications() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: () => notificationsService.list() });
}

export function useUnreadCount() {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: notificationsService.unreadCount,
    enabled: status === 'authenticated',
    select: (d) => d.unreadCount,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onMutate: (id) => {
      qc.setQueryData<NotificationList>(queryKeys.notifications, (old) =>
        old ? { ...old, data: old.data.map((n) => (n.id === id ? { ...n, isRead: true } : n)) } : old,
      );
    },
    onSuccess: ({ unreadCount }) => {
      qc.setQueryData(queryKeys.unreadCount, { unreadCount });
      qc.setQueryData<NotificationList>(queryKeys.notifications, (old) => (old ? { ...old, unreadCount } : old));
    },
    onError: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      qc.setQueryData(queryKeys.unreadCount, { unreadCount: 0 });
      qc.setQueryData<NotificationList>(queryKeys.notifications, (old) =>
        old ? { ...old, unreadCount: 0, data: old.data.map((n) => ({ ...n, isRead: true })) } : old,
      );
    },
  });
}
