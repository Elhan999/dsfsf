'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiEdit2, FiUserPlus } from 'react-icons/fi';
import { Section } from '@/components/layout/Page';
import { ProjectCard, ProjectCardSkeleton, ProjectGrid } from '@/components/project/ProjectCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, SkillList, StatusBadge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useSocket } from '@/hooks/useSocket';
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, formatDate } from '@/lib/format';
import type { UserProfile } from '@/types/api';
import { InviteModal } from './InviteModal';
import { SocialLinks } from './SocialLinks';
import styles from './ProfileView.module.scss';

export function ProfileView({ profile }: { profile: UserProfile }) {
  const { user: me, status } = useAuth();
  const { isOnline } = useSocket();
  const [inviting, setInviting] = useState(false);
  const isMe = me?.id === profile.id;
  const owned = useProjects({ ownerId: profile.id, limit: 12 });
  const memberOf = profile.teams.filter((t) => !t.isOwner);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.banner} aria-hidden />
        <div className={styles.heroBody}>
          <Avatar name={profile.name} src={profile.avatar} size={96} online={isOnline(profile.id, profile.isOnline || isMe)} className={styles.avatar} />
          <div className={styles.identity}>
            <h1>{profile.name}</h1>
            <p className={styles.username}>@{profile.username}</p>
            {profile.jobTitle && <p className={styles.jobTitle}>{profile.jobTitle}</p>}
            <div className={styles.badges}>
              <Badge tone={profile.availability === 'available' ? 'success' : profile.availability === 'busy' ? 'danger' : 'warning'} dot>
                {AVAILABILITY_LABEL[profile.availability]}
              </Badge>
              {profile.experience && <Badge>{EXPERIENCE_LABEL[profile.experience]}</Badge>}
              <span className={styles.joined}>
                <FiCalendar aria-hidden /> Joined {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
          <div className={styles.actions}>
            <SocialLinks githubUrl={profile.githubUrl} telegramUrl={profile.telegramUrl} linkedinUrl={profile.linkedinUrl} />
            {isMe ? (
              <LinkButton href="/settings" variant="secondary" icon={<FiEdit2 />}>
                Edit Profile
              </LinkButton>
            ) : (
              status === 'authenticated' && (
                <Button icon={<FiUserPlus />} onClick={() => setInviting(true)}>
                  Invite
                </Button>
              )
            )}
          </div>
        </div>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
      </section>

      <div className={styles.sections}>
        <Section title="Skills">
          {profile.skills.length ? (
            <SkillList skills={profile.skills.map((s) => s.name)} />
          ) : (
            <p className={styles.muted}>
              {isMe ? (
                <>
                  No skills yet. <Link href="/settings">Add your skills</Link> so teams can find you.
                </>
              ) : (
                'No skills listed yet.'
              )}
            </p>
          )}
        </Section>

        <Section title="Projects">
          {owned.isLoading ? (
            <ProjectGrid>
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </ProjectGrid>
          ) : owned.data?.data.length ? (
            <ProjectGrid>
              {owned.data.data.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </ProjectGrid>
          ) : (
            <EmptyState
              title="No projects yet"
              description={isMe ? 'Start something and invite people to build it with you.' : `${profile.name} hasn't started a project yet.`}
              action={isMe && <LinkButton href="/projects/create">Create a project</LinkButton>}
            />
          )}
        </Section>

        <Section title="Teams">
          {memberOf.length ? (
            <ul className={styles.teams}>
              {memberOf.map((t) => (
                <li key={t.id}>
                  <Link href={isMe ? `/teams/${t.id}` : `/projects/${t.id}`} className={styles.team}>
                    <span className={styles.teamIcon}>{t.name[0]}</span>
                    <span className={styles.teamText}>
                      <strong>{t.name}</strong>
                      <small>{t.role?.name ?? 'Member'}</small>
                    </span>
                    <StatusBadge status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>{isMe ? "You haven't joined another team yet." : 'Not on any other teams yet.'}</p>
          )}
        </Section>
      </div>
      {inviting && <InviteModal user={profile} open={inviting} onClose={() => setInviting(false)} />}
    </>
  );
}
