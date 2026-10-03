'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { FiGrid, FiLogOut, FiMessageSquare, FiUsers } from 'react-icons/fi';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Page } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { MembersList } from '@/components/team/MembersList';
import { TeamOverview } from '@/components/team/TeamOverview';
import { StatusBadge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useProject } from '@/hooks/useProjects';
import { useLeaveTeam } from '@/hooks/useTeams';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import styles from '../teams.module.scss';

type Tab = 'overview' | 'chat' | 'members';

function Workspace() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const initialTab = useSearchParams().get('tab') as Tab | null;
  const [tab, setTab] = useState<Tab>(initialTab ?? 'overview');
  const { data: project, isLoading, isError, error, refetch } = useProject(projectId);
  const leave = useLeaveTeam(projectId);
  const toast = useToast();

  if (isLoading) {
    return (
      <Page wide>
        <Skeleton width="30%" height={36} />
        <div style={{ marginTop: 24 }}>
          <Skeleton height={400} radius={16} />
        </div>
      </Page>
    );
  }
  if (isError || !project) {
    return (
      <Page wide>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Page>
    );
  }
  if (!project.viewer?.isMember) {
    return (
      <Page wide>
        <EmptyState
          icon={<FiUsers />}
          title="This workspace is for team members"
          description="Apply to the project — once the owner accepts, you'll get access to the team chat."
          action={<LinkButton href={`/projects/${projectId}`}>View project</LinkButton>}
        />
      </Page>
    );
  }

  return (
    <Page wide className={styles.workspace}>
      <header className={styles.wsHeader}>
        <div>
          <StatusBadge status={project.status} />
          <h1 style={{ marginTop: 12 }}>{project.name}</h1>
          <p>
            Team workspace · <Link href={`/projects/${project.id}`}>Public page</Link>
          </p>
        </div>
        <div className={styles.wsActions}>
          {!project.viewer.isOwner && (
            <Button
              variant="ghost"
              icon={<FiLogOut />}
              loading={leave.isPending}
              onClick={async () => {
                if (!confirm(`Leave ${project.name}?`)) return;
                try {
                  await leave.mutateAsync();
                  toast.success(`You left ${project.name}`);
                } catch (e) {
                  toast.error('Could not leave team', getErrorMessage(e));
                }
              }}
            >
              Leave team
            </Button>
          )}
        </div>
      </header>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview', icon: <FiGrid /> },
          { value: 'chat', label: 'Chat', icon: <FiMessageSquare /> },
          { value: 'members', label: 'Members', icon: <FiUsers />, count: project.membersCount },
        ]}
      />

      {tab === 'overview' && <TeamOverview project={project} onOpenChat={() => setTab('chat')} />}
      {tab === 'chat' && (
        <div className={styles.chatBox}>
          <ChatPanel projectId={project.id} title={project.name} />
        </div>
      )}
      {tab === 'members' && (
        <div className={styles.membersBox}>
          <MembersList projectId={project.id} members={project.members} canManage={project.viewer.isOwner} />
        </div>
      )}
    </Page>
  );
}

export default function TeamWorkspacePage() {
  return (
    <RequireAuth>
      <Suspense>
        <Workspace />
      </Suspense>
    </RequireAuth>
  );
}
