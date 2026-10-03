'use client';

import Link from 'next/link';
import { FiCheck, FiX } from 'react-icons/fi';
import { Avatar } from '@/components/ui/Avatar';
import { SkillList, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAcceptApplication, useCancelApplication, useRejectApplication } from '@/hooks/useApplications';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/format';
import type { Application } from '@/types/api';
import styles from './ApplicationItem.module.scss';

export function ReceivedApplication({ application }: { application: Application }) {
  const accept = useAcceptApplication();
  const reject = useRejectApplication();
  const { success, error } = useToast();
  const pending = application.status === 'pending';

  const decide = async (action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await accept.mutateAsync(application);
        success(`${application.user.name} joined ${application.project.name}`);
      } else {
        await reject.mutateAsync(application);
        success('Application rejected');
      }
    } catch (e) {
      error('Could not update application', getErrorMessage(e));
    }
  };

  return (
    <article className={styles.item}>
      <div className={styles.main}>
        <Link href={`/profile/${application.user.id}`} className={styles.user}>
          <Avatar name={application.user.name} src={application.user.avatar} size={44} />
          <span>
            <strong>{application.user.name}</strong>
            <small>{application.user.jobTitle ?? `@${application.user.username}`}</small>
          </span>
        </Link>
        <dl className={styles.facts}>
          <div>
            <dt>Project</dt>
            <dd>
              <Link href={`/projects/${application.project.id}`}>{application.project.name}</Link>
            </dd>
          </div>
          <div>
            <dt>Requested role</dt>
            <dd>{application.role?.name ?? 'Any role'}</dd>
          </div>
          <div>
            <dt>Applied</dt>
            <dd>{timeAgo(application.createdAt)}</dd>
          </div>
        </dl>
        {application.message && <blockquote className={styles.message}>{application.message}</blockquote>}
        {application.user.skills.length > 0 && <SkillList skills={application.user.skills.map((s) => s.name)} max={6} />}
      </div>
      <div className={styles.side}>
        {pending ? (
          <>
            <Button variant="success" size="sm" icon={<FiCheck />} loading={accept.isPending} disabled={reject.isPending} onClick={() => decide('accept')}>
              Accept
            </Button>
            <Button variant="danger" size="sm" icon={<FiX />} loading={reject.isPending} disabled={accept.isPending} onClick={() => decide('reject')}>
              Reject
            </Button>
          </>
        ) : (
          <StatusBadge status={application.status} />
        )}
      </div>
    </article>
  );
}

export function SentApplicationRow({ application }: { application: Application }) {
  const cancel = useCancelApplication();
  const { error } = useToast();
  return (
    <tr>
      <td>
        <Link href={`/projects/${application.project.id}`} className={styles.projectLink}>
          {application.project.name}
        </Link>
      </td>
      <td>{application.role?.name ?? 'Any role'}</td>
      <td>
        <StatusBadge status={application.status} />
      </td>
      <td className={styles.date}>{formatDate(application.createdAt)}</td>
      <td className={styles.rowAction}>
        {application.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            loading={cancel.isPending}
            onClick={() => cancel.mutateAsync(application.id).catch((e) => error('Could not cancel', getErrorMessage(e)))}
          >
            Withdraw
          </Button>
        )}
        {application.status === 'accepted' && (
          <Link href={`/teams/${application.project.id}`} className={styles.projectLink}>
            Open workspace →
          </Link>
        )}
      </td>
    </tr>
  );
}
