'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX } from 'react-icons/fi';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useRespondToInvitation } from '@/hooks/useApplications';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { Invitation } from '@/types/api';
import styles from './ApplicationItem.module.scss';

export function InvitationItem({ invitation, direction }: { invitation: Invitation; direction: 'received' | 'sent' }) {
  const respond = useRespondToInvitation();
  const { success, error } = useToast();
  const router = useRouter();
  const person = direction === 'received' ? invitation.sender : invitation.receiver;

  const answer = async (status: 'accepted' | 'rejected') => {
    try {
      await respond.mutateAsync({ id: invitation.id, status });
      if (status === 'accepted') {
        success(`You joined ${invitation.project.name}`);
        router.push(`/teams/${invitation.project.id}`);
      } else {
        success('Invitation declined');
      }
    } catch (e) {
      error('Could not respond', getErrorMessage(e));
    }
  };

  return (
    <article className={styles.item}>
      <div className={styles.main}>
        <Link href={`/profile/${person.id}`} className={styles.user}>
          <Avatar name={person.name} src={person.avatar} size={44} />
          <span>
            <strong>
              {direction === 'received' ? `${person.name} invited you` : `You invited ${person.name}`}
            </strong>
            <small>{timeAgo(invitation.createdAt)}</small>
          </span>
        </Link>
        <dl className={styles.facts}>
          <div>
            <dt>Project</dt>
            <dd>
              <Link href={`/projects/${invitation.project.id}`}>{invitation.project.name}</Link>
            </dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{invitation.role?.name ?? 'Any role'}</dd>
          </div>
        </dl>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{invitation.project.description}</p>
      </div>
      <div className={styles.side}>
        {direction === 'received' && invitation.status === 'pending' ? (
          <>
            <Button variant="success" size="sm" icon={<FiCheck />} loading={respond.isPending} onClick={() => answer('accepted')}>
              Accept
            </Button>
            <Button variant="danger" size="sm" icon={<FiX />} disabled={respond.isPending} onClick={() => answer('rejected')}>
              Decline
            </Button>
          </>
        ) : (
          <StatusBadge status={invitation.status} />
        )}
      </div>
    </article>
  );
}
