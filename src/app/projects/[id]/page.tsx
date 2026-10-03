'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiArrowLeft, FiCheck, FiEdit2, FiLogIn, FiMessageSquare, FiShare2, FiTrash2, FiUsers } from 'react-icons/fi';
import { Page } from '@/components/layout/Page';
import { ApplyModal } from '@/components/project/ApplyModal';
import { MembersList } from '@/components/team/MembersList';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, SkillList, StatusBadge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useRespondToInvitation } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteProject, useProject } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import styles from './project.module.scss';

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const router = useRouter();
  const { status } = useAuth();
  const { data: project, isLoading, isError, error, refetch } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const respond = useRespondToInvitation();
  const toast = useToast();
  const [applying, setApplying] = useState(false);

  if (isLoading) {
    return (
      <Page>
        <Skeleton height={260} radius={20} />
        <div style={{ marginTop: 32, display: 'grid', gap: 16 }}>
          <Skeleton width="40%" height={36} />
          <SkeletonText lines={4} />
        </div>
      </Page>
    );
  }
  if (isError || !project) {
    return (
      <Page>
        <ErrorState title="Couldn't load this project." error={error} onRetry={() => refetch()} />
      </Page>
    );
  }

  const viewer = project.viewer;
  const pendingApplication = viewer?.application?.status === 'pending' ? viewer.application : null;
  const invitation = viewer?.invitation;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: project.name, text: project.description, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${project.name}"? This removes the team, chat and applications for good.`)) return;
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success('Project deleted');
      router.push('/projects');
    } catch (e) {
      toast.error('Could not delete project', getErrorMessage(e));
    }
  };

  const answerInvitation = async (answer: 'accepted' | 'rejected') => {
    if (!invitation) return;
    try {
      await respond.mutateAsync({ id: invitation.id, status: answer });
      if (answer === 'accepted') router.push(`/teams/${project.id}`);
    } catch (e) {
      toast.error('Could not respond', getErrorMessage(e));
    }
  };

  let primaryAction: React.ReactNode;
  if (status !== 'authenticated') {
    primaryAction = (
      <LinkButton href={`/login?next=/projects/${project.id}`} icon={<FiLogIn />}>
        Log in to join
      </LinkButton>
    );
  } else if (viewer?.isOwner) {
    primaryAction = (
      <>
        <LinkButton href={`/teams/${project.id}`} icon={<FiUsers />}>
          Team workspace
        </LinkButton>
        <LinkButton href={`/projects/${project.id}/edit`} variant="secondary" icon={<FiEdit2 />}>
          Edit
        </LinkButton>
      </>
    );
  } else if (viewer?.isMember) {
    primaryAction = (
      <LinkButton href={`/teams/${project.id}`} icon={<FiMessageSquare />}>
        Open workspace
      </LinkButton>
    );
  } else if (invitation) {
    primaryAction = (
      <>
        <Button variant="success" icon={<FiCheck />} loading={respond.isPending} onClick={() => answerInvitation('accepted')}>
          Accept invitation
        </Button>
        <Button variant="ghost" disabled={respond.isPending} onClick={() => answerInvitation('rejected')}>
          Decline
        </Button>
      </>
    );
  } else if (pendingApplication) {
    primaryAction = (
      <Button variant="secondary" disabled>
        Application pending
      </Button>
    );
  } else if (project.status === 'recruiting') {
    primaryAction = <Button onClick={() => setApplying(true)}>Join Project</Button>;
  } else {
    primaryAction = (
      <Button variant="secondary" disabled>
        Not recruiting
      </Button>
    );
  }

  return (
    <Page>
      <Link href="/projects" className={styles.back}>
        <FiArrowLeft /> All projects
      </Link>

      <section className={styles.hero}>
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.image} alt="" className={styles.cover} />
        ) : (
          <div className={styles.coverFallback} aria-hidden />
        )}
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <StatusBadge status={project.status} />
            <Badge>{project.category}</Badge>
          </div>
          <h1>{project.name}</h1>
          <div className={styles.heroActions}>
            {primaryAction}
            <Button variant="secondary" icon={<FiShare2 />} onClick={share}>
              Share
            </Button>
          </div>
        </div>
      </section>

      {invitation && (
        <p className={styles.notice}>You&apos;ve been invited to join this project{project.roles.find((r) => r.id === invitation.roleId) ? ` as ${project.roles.find((r) => r.id === invitation.roleId)!.name}` : ''}.</p>
      )}
      {viewer?.application?.status === 'rejected' && !viewer.isMember && <p className={styles.noticeMuted}>Your previous application wasn&apos;t accepted. You can apply again.</p>}

      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <section className={styles.block}>
            <h2>About</h2>
            <p className={styles.description}>{project.description}</p>
          </section>

          <section className={styles.block}>
            <h2>Required roles</h2>
            {project.roles.length ? (
              <ul className={styles.roles}>
                {project.roles.map((role) => {
                  const open = role.requiredCount - role.filledCount;
                  return (
                    <li key={role.id} className={styles.role}>
                      <div className={styles.roleHead}>
                        <div>
                          <h3>{role.name}</h3>
                          {role.description && <p>{role.description}</p>}
                        </div>
                        {open > 0 ? <Badge tone="accent">{open} open</Badge> : <Badge tone="success">Filled</Badge>}
                      </div>
                      {role.skills.length > 0 && <SkillList skills={role.skills} />}
                      <span className={styles.roleCount}>
                        {role.filledCount} / {role.requiredCount} filled
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.muted}>No specific roles listed.</p>
            )}
          </section>

          {project.skills.length > 0 && (
            <section className={styles.block}>
              <h2>Skills</h2>
              <SkillList skills={project.skills} />
            </section>
          )}
        </div>

        <aside className={styles.side}>
          <div className={styles.sideCard}>
            <h3>Owner</h3>
            <Link href={`/profile/${project.owner.id}`} className={styles.owner}>
              <Avatar name={project.owner.name} src={project.owner.avatar} size={40} />
              <span>
                <strong>{project.owner.name}</strong>
                <small>{project.owner.jobTitle ?? `@${project.owner.username}`}</small>
              </span>
            </Link>
          </div>
          <div className={styles.sideCard}>
            <h3>Details</h3>
            <dl className={styles.facts}>
              <div>
                <dt>Category</dt>
                <dd>{project.category}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={project.status} />
                </dd>
              </div>
              <div>
                <dt>Team size</dt>
                <dd>
                  {project.membersCount} / {project.teamSize} members
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(project.createdAt)}</dd>
              </div>
            </dl>
            <Progress value={project.progress} label="Progress" />
          </div>
          <div className={styles.sideCard}>
            <h3>Team members</h3>
            <MembersList projectId={project.id} members={project.members} compact />
          </div>
          {viewer?.isOwner && (
            <Button variant="danger" icon={<FiTrash2 />} block loading={deleteProject.isPending} onClick={remove}>
              Delete project
            </Button>
          )}
        </aside>
      </div>

      {applying && <ApplyModal project={project} open={applying} onClose={() => setApplying(false)} />}
    </Page>
  );
}
