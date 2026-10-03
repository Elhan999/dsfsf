'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { FiInbox, FiMail, FiSend } from 'react-icons/fi';
import { ReceivedApplication, SentApplicationRow } from '@/components/application/ApplicationItem';
import { InvitationItem } from '@/components/application/InvitationItem';
import { Page, PageHeader } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState, LoadingLabel } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useApplications, useInvitations } from '@/hooks/useApplications';
import styles from './applications.module.scss';

type Tab = 'received' | 'sent' | 'invitations';

function ListSkeleton() {
  return (
    <div className={styles.stack}>
      <LoadingLabel>Loading applications...</LoadingLabel>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={130} radius={16} />
      ))}
    </div>
  );
}

function Received() {
  const { data, isLoading, isError, error, refetch } = useApplications('received');
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data?.length)
    return <EmptyState icon={<FiInbox />} title="No applications received" description="When someone applies to one of your projects, you'll review them here." action={<LinkButton href="/projects/create">Create a project</LinkButton>} />;
  const pending = data.filter((a) => a.status === 'pending');
  const decided = data.filter((a) => a.status !== 'pending');
  return (
    <div className={styles.stack}>
      {pending.length === 0 && <p className={styles.muted}>You&apos;re all caught up — no pending applications.</p>}
      {pending.map((a) => (
        <ReceivedApplication key={a.id} application={a} />
      ))}
      {decided.length > 0 && (
        <>
          <h2 className={styles.subhead}>History</h2>
          {decided.map((a) => (
            <ReceivedApplication key={a.id} application={a} />
          ))}
        </>
      )}
    </div>
  );
}

function Sent() {
  const { data, isLoading, isError, error, refetch } = useApplications('sent');
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data?.length)
    return <EmptyState icon={<FiSend />} title="You haven't applied anywhere yet" description="Find a project you like and hit “Join Project”." action={<LinkButton href="/discover">Discover projects</LinkButton>} />;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Project</th>
            <th>Role</th>
            <th>Status</th>
            <th>Date</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <SentApplicationRow key={a.id} application={a} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Invitations() {
  const received = useInvitations('received');
  const sent = useInvitations('sent');
  if (received.isLoading || sent.isLoading) return <ListSkeleton />;
  if (received.isError) return <ErrorState error={received.error} onRetry={() => received.refetch()} />;
  if (!received.data?.length && !sent.data?.length)
    return <EmptyState icon={<FiMail />} title="No invitations" description="Invitations you send or receive will appear here." />;
  return (
    <div className={styles.stack}>
      {received.data?.map((i) => (
        <InvitationItem key={i.id} invitation={i} direction="received" />
      ))}
      {!!sent.data?.length && (
        <>
          <h2 className={styles.subhead}>Sent invitations</h2>
          {sent.data.map((i) => (
            <InvitationItem key={i.id} invitation={i} direction="sent" />
          ))}
        </>
      )}
    </div>
  );
}

function Applications() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get('tab');
  const [tab, setTab] = useState<Tab>(initial === 'sent' || initial === 'invitations' ? initial : 'received');
  const received = useApplications('received');
  const invitations = useInvitations('received');
  const pendingReceived = received.data?.filter((a) => a.status === 'pending').length ?? 0;
  const pendingInvites = invitations.data?.filter((i) => i.status === 'pending').length ?? 0;

  return (
    <Page>
      <PageHeader title="Applications" description="Review people who want to join your projects and track where you've applied." />
      <Tabs<Tab>
        value={tab}
        onChange={(t) => {
          setTab(t);
          router.replace(`/applications?tab=${t}`, { scroll: false });
        }}
        tabs={[
          { value: 'received', label: 'Received', icon: <FiInbox />, count: pendingReceived },
          { value: 'sent', label: 'Sent', icon: <FiSend /> },
          { value: 'invitations', label: 'Invitations', icon: <FiMail />, count: pendingInvites },
        ]}
      />
      <div style={{ marginTop: 24 }}>
        {tab === 'received' && <Received />}
        {tab === 'sent' && <Sent />}
        {tab === 'invitations' && <Invitations />}
      </div>
    </Page>
  );
}

export default function ApplicationsPage() {
  return (
    <RequireAuth>
      <Suspense>
        <Applications />
      </Suspense>
    </RequireAuth>
  );
}
