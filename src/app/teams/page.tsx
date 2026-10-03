'use client';

import Link from 'next/link';
import { FiCompass, FiPlus, FiUsers } from 'react-icons/fi';
import { Page, PageHeader } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { StatusBadge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useProfile } from '@/hooks/useUsers';
import styles from './teams.module.scss';

function Teams() {
  const { data: me, isLoading, isError, error, refetch } = useProfile();
  return (
    <Page>
      <PageHeader
        title="My teams"
        description="Projects you own or joined. Open one to chat with the team."
        actions={
          <LinkButton href="/projects/create" icon={<FiPlus />}>
            New project
          </LinkButton>
        }
      />
      {isLoading ? (
        <div className={styles.grid}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={16} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : me?.teams.length ? (
        <div className={styles.grid}>
          {me.teams.map((t) => (
            <Link key={t.id} href={`/teams/${t.id}`} className={styles.card}>
              <div className={styles.head}>
                <span className={styles.icon}>{t.name[0]}</span>
                <StatusBadge status={t.status} />
              </div>
              <h3>{t.name}</h3>
              <p>{t.isOwner ? 'Owner' : (t.role?.name ?? 'Member')}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FiUsers />}
          title="No teams yet"
          description="When an owner accepts your application you'll get access to the team workspace here."
          action={
            <LinkButton href="/discover" icon={<FiCompass />}>
              Discover projects
            </LinkButton>
          }
        />
      )}
    </Page>
  );
}

export default function TeamsPage() {
  return (
    <RequireAuth>
      <Teams />
    </RequireAuth>
  );
}
