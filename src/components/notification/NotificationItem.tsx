'use client';

import { useRouter } from 'next/navigation';
import { IconType } from 'react-icons';
import { FiBell, FiCheckCircle, FiInbox, FiMail, FiMessageSquare, FiXCircle } from 'react-icons/fi';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMarkNotificationRead } from '@/hooks/useNotifications';
import { cx, timeAgo } from '@/lib/format';
import type { Notification, NotificationType } from '@/types/api';
import styles from './NotificationItem.module.scss';

const META: Record<NotificationType, { icon: IconType; tone: string; label: string }> = {
  NEW_APPLICATION: { icon: FiInbox, tone: 'accent', label: 'New application' },
  APPLICATION_ACCEPTED: { icon: FiCheckCircle, tone: 'success', label: 'Application accepted' },
  APPLICATION_REJECTED: { icon: FiXCircle, tone: 'danger', label: 'Application rejected' },
  NEW_INVITATION: { icon: FiMail, tone: 'violet', label: 'New invitation' },
  NEW_MESSAGE: { icon: FiMessageSquare, tone: 'accent', label: 'New message' },
  PROJECT_UPDATE: { icon: FiBell, tone: 'neutral', label: 'Project update' },
};

function targetFor(n: Notification): string {
  const projectId = n.project?.id;
  switch (n.type) {
    case 'NEW_APPLICATION':
      return '/applications?tab=received';
    case 'NEW_INVITATION':
      return '/applications?tab=invitations';
    case 'APPLICATION_ACCEPTED':
      return projectId ? `/teams/${projectId}` : '/teams';
    case 'NEW_MESSAGE':
      return projectId ? `/messages?team=${projectId}` : '/messages';
    default:
      return projectId ? `/projects/${projectId}` : '/notifications';
  }
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();
  const router = useRouter();
  const meta = META[notification.type];
  const Icon = meta.icon;

  const open = () => {
    if (!notification.isRead) markRead.mutate(notification.id);
    router.push(targetFor(notification));
  };

  return (
    <li className={cx(styles.item, !notification.isRead && styles.unread)}>
      <button type="button" onClick={open} className={styles.button}>
        <span className={cx(styles.icon, styles[meta.tone])}>
          <Icon aria-hidden />
        </span>
        <span className={styles.content}>
          <span className={styles.kind}>{meta.label}</span>
          <strong>{notification.title}</strong>
          {notification.message && <span className={styles.message}>{notification.message}</span>}
        </span>
        <span className={styles.time}>{timeAgo(notification.createdAt)}</span>
        {!notification.isRead && <span className={styles.dot} aria-label="Unread" />}
      </button>
    </li>
  );
}

export function NotificationSkeleton() {
  return (
    <li className={styles.item} aria-hidden>
      <div className={styles.button}>
        <Skeleton width={40} height={40} radius={12} />
        <span className={styles.content} style={{ gap: 8 }}>
          <Skeleton width={90} height={10} />
          <Skeleton width="60%" height={14} />
        </span>
      </div>
    </li>
  );
}
