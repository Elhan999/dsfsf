'use client';

import { InfiniteData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { teamsService } from '@/services/teams.service';
import type { ApiList, ChatMessage } from '@/types/api';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';

const PAGE_SIZE = 50;
type Pages = InfiniteData<ApiList<ChatMessage>, number>;

/** Appends to the newest page (page 1) unless the message is already there. */
function appendMessage(data: Pages | undefined, message: ChatMessage): Pages | undefined {
  if (!data) return data;
  const [first, ...rest] = data.pages;
  if (first.data.some((m) => m.id === message.id)) return data;
  // Drop the matching optimistic copy, if any.
  const withoutPending = first.data.filter(
    (m) => !(m.pending && m.sender.id === message.sender.id && m.content === message.content),
  );
  return {
    ...data,
    pages: [
      { ...first, data: [...withoutPending, message], pagination: { ...first.pagination, total: first.pagination.total + 1 } },
      ...rest,
    ],
  };
}

export function useChat(projectId: number | undefined) {
  const { user } = useAuth();
  const { send, subscribe, status } = useSocket();
  const qc = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const typingTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const lastTypingSent = useRef(0);
  const stopTypingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [sendError, setSendError] = useState<string | null>(null);

  const key = queryKeys.teamMessages(projectId ?? 0);

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => teamsService.messages(projectId!, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page * last.pagination.limit < last.pagination.total ? last.pagination.page + 1 : undefined,
    enabled: !!projectId,
  });

  // Page 1 is newest; render oldest → newest.
  const messages = useMemo(() => {
    const seen = new Set<number>();
    return (query.data?.pages ?? [])
      .slice()
      .reverse()
      .flatMap((p) => p.data)
      .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }, [query.data]);

  // Join the room whenever the socket (re)connects.
  useEffect(() => {
    if (!projectId || status !== 'open') return;
    send({ type: 'join_project', projectId });
    return () => {
      send({ type: 'leave_project', projectId });
    };
  }, [projectId, status, send]);

  useEffect(() => {
    if (!projectId) return;
    const timers = typingTimers.current;
    const clearTyping = (userId: number) => {
      clearTimeout(timers.get(userId));
      timers.delete(userId);
      setTypingUsers((prev) => {
        if (!prev.has(userId)) return prev;
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    const unsubscribe = subscribe((event) => {
      if (event.type === 'new_message' && event.data.projectId === projectId) {
        qc.setQueryData<Pages>(key, (old) => appendMessage(old, event.data));
        clearTyping(event.data.sender.id);
      } else if (event.type === 'typing_start' && event.projectId === projectId) {
        setTypingUsers((prev) => new Map(prev).set(event.user.id, event.user.name));
        clearTimeout(timers.get(event.user.id));
        timers.set(event.user.id, setTimeout(() => clearTyping(event.user.id), 5000));
      } else if (event.type === 'typing_stop' && event.projectId === projectId) {
        clearTyping(event.user.id);
      } else if (event.type === 'member_left' && event.projectId === projectId) {
        qc.invalidateQueries({ queryKey: queryKeys.teamMembers(projectId) });
      } else if (event.type === 'error' && event.event === 'send_message' && event.projectId === projectId) {
        setSendError(event.message);
        qc.invalidateQueries({ queryKey: key });
      }
    });
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
      timers.clear();
      setTypingUsers(new Map());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, subscribe, qc]);

  const notifyTyping = useCallback(() => {
    if (!projectId) return;
    const now = Date.now();
    if (now - lastTypingSent.current > 2500) {
      lastTypingSent.current = now;
      send({ type: 'typing_start', projectId });
    }
    clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => {
      lastTypingSent.current = 0;
      send({ type: 'typing_stop', projectId });
    }, 3000);
  }, [projectId, send]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!projectId || !user) return;
      setSendError(null);
      clearTimeout(stopTypingTimer.current);
      lastTypingSent.current = 0;
      send({ type: 'typing_stop', projectId });

      const optimistic: ChatMessage = {
        id: -Date.now(),
        projectId,
        content,
        createdAt: new Date().toISOString(),
        sender: { id: user.id, name: user.name, username: user.username, avatar: user.avatar, jobTitle: user.jobTitle },
        pending: true,
      };
      qc.setQueryData<Pages>(key, (old) =>
        old ? { ...old, pages: [{ ...old.pages[0], data: [...old.pages[0].data, optimistic] }, ...old.pages.slice(1)] } : old,
      );

      if (send({ type: 'send_message', projectId, content })) return;
      // Socket unavailable: fall back to REST (the server still broadcasts to everyone else).
      try {
        const saved = await teamsService.sendMessage(projectId, content);
        qc.setQueryData<Pages>(key, (old) => appendMessage(old, saved));
      } catch {
        setSendError('Message not sent. Check your connection and try again.');
        qc.setQueryData<Pages>(key, (old) =>
          old
            ? { ...old, pages: [{ ...old.pages[0], data: old.pages[0].data.filter((m) => m.id !== optimistic.id) }, ...old.pages.slice(1)] }
            : old,
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, user, send, qc],
  );

  return {
    ...query,
    messages,
    typingUsers: [...typingUsers.values()],
    sendMessage,
    notifyTyping,
    sendError,
    connection: status,
  };
}
