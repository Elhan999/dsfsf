'use client';

import { FiBell, FiCheck } from 'react-icons/fi';
import { Page, PageHeader } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { NotificationItem, NotificationSkeleton } from '@/components/notification/NotificationItem';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useMarkAllNotificationsRead, useNotifications } from '@/hooks/useNotifications';
import styles from './notifications.module.scss';

function Notifications() {
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unread = data?.unreadCount ?? 0;

  return (
    <Page>
      <PageHeader
        title="Notifications"
        description={unread ? `You have ${unread} unread ${unread === 1 ? 'notification' : 'notifications'}.` : "You're all caught up."}
        actions={
          <Button variant="secondary" icon={<FiCheck />} disabled={!unread} loading={markAll.isPending} onClick={() => markAll.mutate()}>
            Mark all as read
          </Button>
        }
      />
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ul className={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <NotificationSkeleton key={i} />
          ))}
        </ul>
      ) : data?.data.length ? (
        <ul className={styles.list}>
          {data.data.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </ul>
      ) : (
        <EmptyState icon={<FiBell />} title="No notifications yet" description="Applications, invitations and team messages will show up here in real time." />
      )}
    </Page>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <Notifications />
    </RequireAuth>
  );
}
