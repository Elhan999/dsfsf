'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiFolder, FiUserPlus } from 'react-icons/fi';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, SkillList } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { AVAILABILITY_LABEL } from '@/lib/format';
import type { UserCard as UserCardData } from '@/types/api';
import { InviteModal } from './InviteModal';
import { SocialLinks } from './SocialLinks';
import styles from './UserCard.module.scss';

export function UserCard({ user, highlight }: { user: UserCardData; highlight?: string[] }) {
  const { user: me, status } = useAuth();
  const { isOnline } = useSocket();
  const [inviting, setInviting] = useState(false);
  const online = isOnline(user.id, user.isOnline);

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <Avatar name={user.name} src={user.avatar} size={52} online={online} />
        <div className={styles.identity}>
          <h3>
            <Link href={`/profile/${user.id}`}>{user.name}</Link>
          </h3>
          <p>{user.jobTitle ?? 'Team Finder member'}</p>
        </div>
        <Badge tone={user.availability === 'available' ? 'success' : user.availability === 'busy' ? 'danger' : 'warning'}>
          {AVAILABILITY_LABEL[user.availability]}
        </Badge>
      </header>
      {user.bio && <p className={styles.bio}>{user.bio}</p>}
      {user.skills.length > 0 && <SkillList skills={user.skills.map((s) => s.name)} max={5} matched={highlight} />}
      <div className={styles.meta}>
        <span>
          <FiFolder aria-hidden /> {user.projectsCount} {user.projectsCount === 1 ? 'project' : 'projects'}
        </span>
        <SocialLinks githubUrl={user.githubUrl} telegramUrl={user.telegramUrl} />
      </div>
      <footer className={styles.actions}>
        <LinkButton href={`/profile/${user.id}`} variant="secondary" size="sm" block>
          View Profile
        </LinkButton>
        {status === 'authenticated' && me?.id !== user.id && (
          <Button size="sm" icon={<FiUserPlus />} block onClick={() => setInviting(true)}>
            Invite
          </Button>
        )}
      </footer>
      {inviting && <InviteModal user={user} open={inviting} onClose={() => setInviting(false)} />}
    </article>
  );
}

export function UserCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden>
      <div className={styles.head}>
        <Skeleton width={52} height={52} radius="50%" />
        <div className={styles.identity} style={{ gap: 8 }}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="70%" height={12} />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div style={{ display: 'flex', gap: 6 }}>
        <Skeleton width={60} height={24} />
        <Skeleton width={80} height={24} />
      </div>
      <Skeleton height={32} />
    </div>
  );
}

export function UserGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
