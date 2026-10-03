'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FiArrowLeft, FiCompass, FiMessageSquare } from 'react-icons/fi';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { MembersList } from '@/components/team/MembersList';
import { TeamListItem } from '@/components/team/TeamOverview';
import { LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useTeamMembers } from '@/hooks/useTeams';
import { cx } from '@/lib/format';
import styles from './messages.module.scss';

function Messages() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const teams = user?.teams ?? [];
  const selectedId = Number(params.get('team')) || null;
  const selected = teams.find((t) => t.id === selectedId) ?? null;
  // Desktop falls back to the first team; mobile shows the list until one is picked.
  const active = selected ?? teams[0] ?? null;
  const members = useTeamMembers(active?.id);

  if (!teams.length) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState
          icon={<FiMessageSquare />}
          title="No conversations yet"
          description="Team chats appear here once you create a project or get accepted into one."
          action={
            <LinkButton href="/discover" icon={<FiCompass />}>
              Discover projects
            </LinkButton>
          }
        />
      </div>
    );
  }

  return (
    <div className={cx(styles.layout, selected && styles.hasSelection)}>
      <aside className={styles.teams}>
        <h1>Messages</h1>
        <nav aria-label="Team chats">
          {teams.map((t) => (
            <Link key={t.id} href={`/messages?team=${t.id}`} scroll={false}>
              <TeamListItem team={t} active={t.id === active?.id} />
            </Link>
          ))}
        </nav>
      </aside>

      <section className={styles.chat}>
        {active && (
          <>
            <header className={styles.chatHeader}>
              <button className={styles.backBtn} onClick={() => router.push('/messages')} aria-label="Back to conversations">
                <FiArrowLeft />
              </button>
              <div>
                <h2>{active.name}</h2>
                <small>{members.data ? `${members.data.length} members` : ' '}</small>
              </div>
              <Link href={`/teams/${active.id}`} className={styles.wsLink}>
                Workspace →
              </Link>
            </header>
            <div className={styles.chatBody}>
              <ChatPanel key={active.id} projectId={active.id} title={active.name} />
            </div>
          </>
        )}
      </section>

      <aside className={styles.members}>
        <h3>Members</h3>
        {members.isLoading ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={40} radius={10} />
            ))}
          </div>
        ) : (
          members.data && active && <MembersList projectId={active.id} members={members.data} compact />
        )}
      </aside>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <RequireAuth>
      <Suspense>
        <Messages />
      </Suspense>
    </RequireAuth>
  );
}
