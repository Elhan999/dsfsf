'use client';

import { FormEvent, KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FiSend, FiWifiOff } from 'react-icons/fi';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { cx, formatTime } from '@/lib/format';
import type { ChatMessage } from '@/types/api';
import { EmojiPicker } from './EmojiPicker';
import styles from './Chat.module.scss';

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function ChatPanel({ projectId, title }: { projectId: number; title?: string }) {
  const { user } = useAuth();
  const chat = useChat(projectId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef(0);

  // Keep the view pinned to the newest message unless the user scrolled up.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    else if (prevHeight.current && el.scrollHeight > prevHeight.current && el.scrollTop < 40) {
      // Older page was prepended: keep the same message under the cursor.
      el.scrollTop += el.scrollHeight - prevHeight.current;
    }
    prevHeight.current = el.scrollHeight;
  }, [chat.messages, chat.typingUsers.length]);

  useEffect(() => {
    stickToBottom.current = true;
    setDraft('');
  }, [projectId]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content) return;
    stickToBottom.current = true;
    chat.sendMessage(content);
    setDraft('');
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const typingText =
    chat.typingUsers.length === 1
      ? `${chat.typingUsers[0]} is typing…`
      : chat.typingUsers.length > 1
        ? `${chat.typingUsers.slice(0, 2).join(' and ')}${chat.typingUsers.length > 2 ? ' and others' : ''} are typing…`
        : '';

  return (
    <section className={styles.panel} aria-label={title ? `${title} chat` : 'Team chat'}>
      {chat.connection !== 'open' && chat.connection !== 'idle' && (
        <div className={styles.banner} role="status">
          <FiWifiOff aria-hidden /> {chat.connection === 'connecting' ? 'Connecting…' : 'Reconnecting… messages will still be saved.'}
        </div>
      )}
      <div className={styles.scroll} ref={scrollRef} onScroll={onScroll}>
        {chat.isLoading ? (
          <div className={styles.messages} aria-label="Loading messages">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <Skeleton width={36} height={36} radius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Skeleton width={120} height={12} />
                  <Skeleton width={`${50 + i * 10}%`} height={14} />
                </div>
              </div>
            ))}
          </div>
        ) : chat.isError ? (
          <div className={styles.center}>
            <ErrorState error={chat.error} onRetry={() => chat.refetch()} />
          </div>
        ) : chat.messages.length === 0 ? (
          <div className={styles.center}>
            <div className={styles.emptyChat}>
              <span>👋</span>
              <h3>Start the conversation</h3>
              <p>Say hi to your team — messages are delivered in real time.</p>
            </div>
          </div>
        ) : (
          <div className={styles.messages}>
            {chat.hasNextPage && (
              <div className={styles.loadMore}>
                <Button variant="ghost" size="sm" loading={chat.isFetchingNextPage} onClick={() => chat.fetchNextPage()}>
                  Load earlier messages
                </Button>
              </div>
            )}
            {chat.messages.map((m, i) => (
              <MessageRow key={m.id} message={m} previous={chat.messages[i - 1]} mine={m.sender.id === user?.id} />
            ))}
          </div>
        )}
      </div>
      <div className={styles.typing} aria-live="polite">
        {typingText && (
          <>
            <span className={styles.typingDots} aria-hidden>
              <i />
              <i />
              <i />
            </span>
            {typingText}
          </>
        )}
      </div>
      {chat.sendError && (
        <p className={styles.sendError} role="alert">
          {chat.sendError}
        </p>
      )}
      <form className={styles.composer} onSubmit={submit}>
        <EmojiPicker
          onSelect={(emoji) => {
            setDraft((d) => d + emoji);
            inputRef.current?.focus();
          }}
        />
        <textarea
          ref={inputRef}
          value={draft}
          rows={1}
          maxLength={4000}
          placeholder={title ? `Message ${title}` : 'Write a message…'}
          aria-label="Message"
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value) chat.notifyTyping();
          }}
          onKeyDown={onKeyDown}
        />
        <IconButton type="submit" label="Send" className={styles.send} disabled={!draft.trim()}>
          <FiSend />
        </IconButton>
      </form>
    </section>
  );
}

function MessageRow({ message, previous, mine }: { message: ChatMessage; previous?: ChatMessage; mine: boolean }) {
  const newDay = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
  const grouped =
    !newDay &&
    previous?.sender.id === message.sender.id &&
    new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < GROUP_WINDOW_MS;

  return (
    <>
      {newDay && (
        <div className={styles.day}>
          <span>{dayLabel(message.createdAt)}</span>
        </div>
      )}
      <div className={cx(styles.message, grouped && styles.grouped, mine && styles.mine, message.pending && styles.pending)}>
        <div className={styles.avatarCol}>
          {!grouped ? (
            <Avatar name={message.sender.name} src={message.sender.avatar} size={36} />
          ) : (
            <time className={styles.hoverTime}>{formatTime(message.createdAt)}</time>
          )}
        </div>
        <div className={styles.bubbleCol}>
          {!grouped && (
            <div className={styles.meta}>
              <strong>{message.sender.name}</strong>
              <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            </div>
          )}
          <p className={styles.content}>{message.content}</p>
        </div>
      </div>
    </>
  );
}
