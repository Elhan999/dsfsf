'use client';

import Link from 'next/link';
import { FiMessageSquare, FiUserPlus } from 'react-icons/fi';
import { ReceivedApplication } from '@/components/application/ApplicationItem';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, SkillList } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useProjectApplications } from '@/hooks/useApplications';
import { useChat } from '@/hooks/useChat';
import { timeAgo } from '@/lib/format';
import type { ProjectDetail } from '@/types/api';
import { MembersList } from './MembersList';
import styles from './Team.module.scss';

interface Activity {
  id: string;
  at: string;
  icon: React.ReactNode;
  text: React.ReactNode;
}

export function TeamOverview({ project, onOpenChat }: { project: ProjectDetail; onOpenChat: () => void }) {
  const isOwner = !!project.viewer?.isOwner;
  const applications = useProjectApplications(project.id, isOwner);
  const { messages } = useChat(project.id);
  const pending = applications.data?.filter((a) => a.status === 'pending') ?? [];
  const openRoles = project.roles.filter((r) => r.filledCount < r.requiredCount);

  const activity: Activity[] = [
    ...project.members.map((m) => ({
      id: `m${m.user.id}`,
      at: m.joinedAt,
      icon: <FiUserPlus />,
      text: (
        <>
          <strong>{m.user.name}</strong> {m.isOwner ? 'created the project' : `joined${m.role ? ` as ${m.role.name}` : ''}`}
        </>
      ),
    })),
    ...messages.slice(-5).map((msg) => ({
      id: `c${msg.id}`,
      at: msg.createdAt,
      icon: <FiMessageSquare />,
      text: (
        <>
          <strong>{msg.sender.name}</strong>: {msg.content.length > 80 ? `${msg.content.slice(0, 77)}…` : msg.content}
        </>
      ),
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <div className={styles.overview}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Progress value={project.progress} label="Project progress" />
          {isOwner && (
            <Link href={`/projects/${project.id}/edit`} className={styles.small}>
              Update progress →
            </Link>
          )}
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Members</span>
          <strong className={styles.statValue}>
            {project.membersCount}
            <small> / {project.teamSize}</small>
          </strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Open positions</span>
          <strong className={styles.statValue}>{project.openPositions}</strong>
        </div>
      </div>

      {isOwner && pending.length > 0 && (
        <section className={styles.panelBlock}>
          <h3>
            Pending applications <Badge tone="warning">{pending.length}</Badge>
          </h3>
          <div className={styles.stack}>
            {pending.map((a) => (
              <ReceivedApplication key={a.id} application={a} />
            ))}
          </div>
        </section>
      )}

      <div className={styles.twoCol}>
        <section className={styles.panelBlock}>
          <h3>Required roles</h3>
          <ul className={styles.roleList}>
            {project.roles.map((r) => (
              <li key={r.id}>
                <div className={styles.roleLine}>
                  <strong>{r.name}</strong>
                  <span>
                    {r.filledCount}/{r.requiredCount}
                  </span>
                </div>
                {r.skills.length > 0 && <SkillList skills={r.skills} max={4} />}
              </li>
            ))}
            {project.roles.length === 0 && <li className={styles.muted}>No roles defined.</li>}
          </ul>
          {openRoles.length > 0 && (
            <p className={styles.muted}>
              Still looking for: {openRoles.map((r) => r.name).join(', ')}.{' '}
              <Link href="/ai-match" className={styles.link}>
                Find matches with AI
              </Link>
            </p>
          )}
        </section>

        <section className={styles.panelBlock}>
          <h3>Members</h3>
          <MembersList projectId={project.id} members={project.members} compact />
        </section>
      </div>

      <section className={styles.panelBlock}>
        <div className={styles.blockHead}>
          <h3>Recent activity</h3>
          <button className={styles.link} onClick={onOpenChat}>
            Open chat →
          </button>
        </div>
        <ul className={styles.activity}>
          {activity.map((a) => (
            <li key={a.id}>
              <span className={styles.activityIcon}>{a.icon}</span>
              <span className={styles.activityText}>{a.text}</span>
              <time>{timeAgo(a.at)}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function TeamListItem({ team, active }: { team: { id: number; name: string; image: string | null; role: { name: string } | null; isOwner: boolean }; active?: boolean }) {
  return (
    <span className={`${styles.teamItem} ${active ? styles.teamItemActive : ''}`}>
      {team.image ? <Avatar name={team.name} src={team.image} size={36} /> : <span className={styles.teamIcon}>{team.name[0]}</span>}
      <span className={styles.teamText}>
        <strong>{team.name}</strong>
        <small>{team.isOwner ? 'Owner' : (team.role?.name ?? 'Member')}</small>
      </span>
    </span>
  );
}
