'use client';

import Link from 'next/link';
import { FiArrowRight, FiCpu, FiInbox, FiPlus, FiSend } from 'react-icons/fi';
import { Page, PageHeader, Section } from '@/components/layout/Page';
import { NotificationItem, NotificationSkeleton } from '@/components/notification/NotificationItem';
import { UserCard, UserCardSkeleton, UserGrid } from '@/components/profile/UserCard';
import { ProjectCard, ProjectCardSkeleton, ProjectGrid } from '@/components/project/ProjectCard';
import { StatusBadge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useRecommendations } from '@/hooks/useUsers';
import { greeting, timeAgo } from '@/lib/format';
import styles from './Dashboard.module.scss';

export function Dashboard() {
  const { user } = useAuth();
  const recommendations = useRecommendations();
  const notifications = useNotifications();
  const received = useApplications('received');
  const sent = useApplications('sent');
  const pendingReceived = received.data?.filter((a) => a.status === 'pending') ?? [];
  const teams = user?.teams ?? [];

  return (
    <Page wide>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`${greeting()}, ${user?.name.split(' ')[0]}.`}
        description="Here's what's happening across your projects and teams."
        actions={
          <>
            <LinkButton href="/ai-match" variant="secondary" icon={<FiCpu />}>
              AI match
            </LinkButton>
            <LinkButton href="/projects/create" icon={<FiPlus />}>
              New project
            </LinkButton>
          </>
        }
      />

      {user && user.skills.length === 0 && (
        <div className={styles.nudge}>
          <div>
            <strong>Add your skills to get better recommendations</strong>
            <p>Projects and people below are ranked by the skills on your profile.</p>
          </div>
          <LinkButton href="/settings" size="sm" variant="secondary">
            Add skills
          </LinkButton>
        </div>
      )}

      <div className={styles.stats}>
        <Link href="/teams" className={styles.stat}>
          <span>My teams</span>
          <strong>{teams.length}</strong>
        </Link>
        <Link href="/applications?tab=received" className={styles.stat}>
          <span>Pending applications</span>
          <strong>{received.isLoading ? '–' : pendingReceived.length}</strong>
        </Link>
        <Link href="/applications?tab=sent" className={styles.stat}>
          <span>Applications sent</span>
          <strong>{sent.isLoading ? '–' : (sent.data?.length ?? 0)}</strong>
        </Link>
        <Link href="/notifications" className={styles.stat}>
          <span>Unread notifications</span>
          <strong>{notifications.data?.unreadCount ?? '–'}</strong>
        </Link>
      </div>

      <Section title="Recommended projects" action={<Link href="/discover">Browse all</Link>}>
        {recommendations.isError ? (
          <ErrorState error={recommendations.error} onRetry={() => recommendations.refetch()} />
        ) : recommendations.isLoading ? (
          <ProjectGrid>
            {[0, 1, 2].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </ProjectGrid>
        ) : recommendations.data?.projects.length ? (
          <ProjectGrid>
            {recommendations.data.projects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </ProjectGrid>
        ) : (
          <EmptyState title="No recommendations yet" description="There are no recruiting projects you haven't joined. Why not start one?" action={<LinkButton href="/projects/create">Create a project</LinkButton>} />
        )}
      </Section>

      <Section title="Recommended teammates" action={<Link href="/teammates">Find more</Link>}>
        {recommendations.isLoading ? (
          <UserGrid>
            {[0, 1, 2].map((i) => (
              <UserCardSkeleton key={i} />
            ))}
          </UserGrid>
        ) : recommendations.data?.users.length ? (
          <UserGrid>
            {recommendations.data.users.slice(0, 3).map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </UserGrid>
        ) : (
          !recommendations.isError && <EmptyState title="No teammates to recommend yet" />
        )}
      </Section>

      <div className={styles.columns}>
        <Section title="My teams" action={<Link href="/teams">View all</Link>}>
          {teams.length ? (
            <ul className={styles.list}>
              {teams.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link href={`/teams/${t.id}`} className={styles.row}>
                    <span className={styles.teamIcon}>{t.name[0]}</span>
                    <span className={styles.rowText}>
                      <strong>{t.name}</strong>
                      <small>{t.isOwner ? 'Owner' : (t.role?.name ?? 'Member')}</small>
                    </span>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="You're not on a team yet" description="Apply to a project or create your own." action={<LinkButton href="/discover" size="sm">Discover projects</LinkButton>} />
          )}
        </Section>

        <Section title="Applications" action={<Link href="/applications">Manage</Link>}>
          {received.isLoading || sent.isLoading ? (
            <div className={styles.list}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={56} radius={12} />
              ))}
            </div>
          ) : pendingReceived.length || sent.data?.length ? (
            <ul className={styles.list}>
              {pendingReceived.slice(0, 3).map((a) => (
                <li key={`r${a.id}`}>
                  <Link href="/applications?tab=received" className={styles.row}>
                    <span className={styles.rowIcon}>
                      <FiInbox />
                    </span>
                    <span className={styles.rowText}>
                      <strong>
                        {a.user.name} → {a.project.name}
                      </strong>
                      <small>
                        {a.role?.name ?? 'Any role'} · {timeAgo(a.createdAt)}
                      </small>
                    </span>
                    <FiArrowRight className={styles.chev} />
                  </Link>
                </li>
              ))}
              {sent.data?.slice(0, 3).map((a) => (
                <li key={`s${a.id}`}>
                  <Link href={`/projects/${a.project.id}`} className={styles.row}>
                    <span className={styles.rowIcon}>
                      <FiSend />
                    </span>
                    <span className={styles.rowText}>
                      <strong>{a.project.name}</strong>
                      <small>
                        {a.role?.name ?? 'Any role'} · {timeAgo(a.createdAt)}
                      </small>
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No applications yet" description="Applications you send or receive show up here." />
          )}
        </Section>
      </div>

      <Section title="Recent activity" action={<Link href="/notifications">All notifications</Link>}>
        <div className={styles.activity}>
          {notifications.isLoading ? (
            <ul>
              {[0, 1, 2].map((i) => (
                <NotificationSkeleton key={i} />
              ))}
            </ul>
          ) : notifications.isError ? (
            <ErrorState error={notifications.error} onRetry={() => notifications.refetch()} />
          ) : notifications.data?.data.length ? (
            <ul>
              {notifications.data.data.slice(0, 5).map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </ul>
          ) : (
            <EmptyState title="All quiet" description="Activity from your projects and teams will appear here." />
          )}
        </div>
      </Section>
    </Page>
  );
}
