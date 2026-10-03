'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { notificationsService } from '@/services/notifications.service';
import type { ClientEvent, NotificationList, ServerEvent } from '@/types/api';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

const POLL_INTERVAL = 10_000;

type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed';
type Handler = (event: ServerEvent) => void;

interface SocketContextValue {
  status: ConnectionStatus;
  send: (event: ClientEvent) => boolean;
  subscribe: (handler: Handler) => () => void;
  onlineUserIds: ReadonlySet<number>;
  isOnline: (userId: number, fallback?: boolean) => boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const NOTIFICATION_INVALIDATIONS: Record<string, readonly (readonly unknown[])[]> = {
  NEW_APPLICATION: [queryKeys.applications, queryKeys.projects],
  APPLICATION_ACCEPTED: [queryKeys.applications, queryKeys.projects, queryKeys.me, queryKeys.recommendations],
  APPLICATION_REJECTED: [queryKeys.applications, queryKeys.projects],
  NEW_INVITATION: [queryKeys.invitations],
  PROJECT_UPDATE: [queryKeys.projects, queryKeys.me, queryKeys.invitations],
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const status: ConnectionStatus = 'idle';
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  // Presence we have heard about explicitly; users not in here fall back to the API's isOnline.
  const [knownPresence, setKnownPresence] = useState<Map<number, boolean>>(new Map());
  const handlers = useRef(new Set<Handler>());

  const setPresence = useCallback((ids: number[], online: boolean) => {
    setKnownPresence((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.set(id, online));
      return next;
    });
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (online ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const handleGlobal = useCallback(
    (event: ServerEvent) => {
      switch (event.type) {
        case 'connected':
          setPresence([event.userId], true);
          break;
        case 'joined_project':
          setPresence(event.onlineUserIds, true);
          break;
        case 'user_online':
          setPresence([event.userId], true);
          break;
        case 'user_offline':
          setPresence([event.userId], false);
          break;
        case 'new_notification': {
          queryClient.setQueryData(queryKeys.unreadCount, { unreadCount: event.unreadCount });
          queryClient.setQueryData<NotificationList>(queryKeys.notifications, (old) =>
            old
              ? {
                  ...old,
                  data: [event.data, ...old.data.filter((n) => n.id !== event.data.id)],
                  unreadCount: event.unreadCount,
                  pagination: { ...old.pagination, total: old.pagination.total + 1 },
                }
              : old,
          );
          (NOTIFICATION_INVALIDATIONS[event.data.type] ?? []).forEach((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          );
          if (event.data.type !== 'NEW_MESSAGE' || !location.pathname.startsWith('/messages')) {
            toast({
              tone: event.data.type === 'APPLICATION_REJECTED' ? 'info' : 'success',
              title: event.data.title,
              description: event.data.message ?? undefined,
              href: '/notifications',
            });
          }
          break;
        }
        case 'removed_from_project':
          queryClient.invalidateQueries({ queryKey: queryKeys.me });
          queryClient.invalidateQueries({ queryKey: queryKeys.project(event.projectId) });
          break;
      }
    },
    [queryClient, setPresence, toast],
  );

  // Serverless hosting has no persistent connections, so new notifications are polled instead.
  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    let cancelled = false;
    let lastSeenId: number | null = null;

    const poll = async () => {
      let list: NotificationList;
      try {
        list = await notificationsService.list(1, 10);
      } catch {
        return;
      }
      if (cancelled) return;
      const newestId = list.data[0]?.id ?? 0;
      // The first poll only records where we are; anything older than that is not "new".
      if (lastSeenId !== null) {
        const fresh = list.data.filter((n) => n.id > lastSeenId!).reverse();
        fresh.forEach((data) => {
          const event: ServerEvent = { type: 'new_notification', data, unreadCount: list.unreadCount };
          handleGlobal(event);
          handlers.current.forEach((h) => h(event));
        });
      }
      lastSeenId = Math.max(lastSeenId ?? 0, newestId);
    };

    poll();
    const timer = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [authStatus, handleGlobal]);

  // No live connection to send over: callers fall back to the REST API.
  const send = useCallback((_event: ClientEvent) => false, []);

  const subscribe = useCallback((handler: Handler) => {
    handlers.current.add(handler);
    return () => {
      handlers.current.delete(handler);
    };
  }, []);

  const isOnline = useCallback(
    (userId: number, fallback = false) => knownPresence.get(userId) ?? fallback,
    [knownPresence],
  );

  const value = useMemo(
    () => ({ status, send, subscribe, onlineUserIds, isOnline }),
    [status, send, subscribe, onlineUserIds, isOnline],
  );
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}
