'use client';

import Link from 'next/link';
import { FiUserMinus } from 'react-icons/fi';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';
import { useRemoveMember } from '@/hooks/useTeams';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import { cx } from '@/lib/format';
import type { ProjectMember } from '@/types/api';
import styles from './MembersList.module.scss';

export function MembersList({
  projectId,
  members,
  canManage,
  compact,
}: {
  projectId: number;
  members: ProjectMember[];
  canManage?: boolean;
  compact?: boolean;
}) {
  const { isOnline } = useSocket();
  const remove = useRemoveMember(projectId);
  const { success, error } = useToast();

  const sorted = [...members].sort(
    (a, b) => Number(b.isOwner) - Number(a.isOwner) || Number(isOnline(b.user.id, b.user.isOnline)) - Number(isOnline(a.user.id, a.user.isOnline)),
  );
  const onlineCount = members.filter((m) => isOnline(m.user.id, m.user.isOnline)).length;

  return (
    <div className={cx(styles.wrap, compact && styles.compact)}>
      <p className={styles.summary}>
        {members.length} members · <span className={styles.onlineText}>{onlineCount} online</span>
      </p>
      <ul className={styles.list}>
        {sorted.map((m) => {
          const online = isOnline(m.user.id, m.user.isOnline);
          return (
            <li key={m.user.id} className={styles.member}>
              <Link href={`/profile/${m.user.id}`} className={styles.person}>
                <Avatar name={m.user.name} src={m.user.avatar} size={compact ? 32 : 40} online={online} />
                <span className={styles.text}>
                  <strong>{m.user.name}</strong>
                  <small>{m.role?.name ?? (m.isOwner ? 'Owner' : m.user.jobTitle ?? 'Member')}</small>
                </span>
              </Link>
              {m.isOwner && <Badge tone="accent">Owner</Badge>}
              {canManage && !m.isOwner && (
                <IconButton
                  label={`Remove ${m.user.name}`}
                  onClick={async () => {
                    if (!confirm(`Remove ${m.user.name} from the team?`)) return;
                    try {
                      await remove.mutateAsync(m.user.id);
                      success(`${m.user.name} was removed`);
                    } catch (e) {
                      error('Could not remove member', getErrorMessage(e));
                    }
                  }}
                >
                  <FiUserMinus />
                </IconButton>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
