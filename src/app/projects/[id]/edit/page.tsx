'use client';

import { useParams, useRouter } from 'next/navigation';
import { Page, PageHeader } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ProjectForm } from '@/components/project/ProjectForm';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { LinkButton } from '@/components/ui/Button';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';
import { useState } from 'react';

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const router = useRouter();
  const { data: project, isLoading, isError, error, refetch } = useProject(projectId);
  const update = useUpdateProject(projectId);
  const { success } = useToast();
  const [progress, setProgress] = useState<number | null>(null);

  return (
    <RequireAuth>
      <Page>
        <PageHeader eyebrow="Edit project" title={project?.name ?? 'Edit project'} />
        {isLoading ? (
          <Skeleton height={420} radius={16} />
        ) : isError || !project ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !project.viewer?.isOwner ? (
          <EmptyState title="Only the owner can edit this project." action={<LinkButton href={`/projects/${projectId}`}>Back to project</LinkButton>} />
        ) : (
          <>
            <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Progress value={progress ?? project.progress} label="Project progress" />
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress ?? project.progress}
                aria-label="Project progress"
                onChange={(e) => setProgress(Number(e.target.value))}
                onPointerUp={() => progress !== null && update.mutate({ progress })}
                onKeyUp={() => progress !== null && update.mutate({ progress })}
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
            <ProjectForm
              mode="edit"
              initialValues={{
                name: project.name,
                description: project.description,
                category: project.category,
                image: project.image ?? '',
                status: project.status,
                roles: project.roles.map((r) => ({
                  id: r.id,
                  name: r.name,
                  description: r.description ?? '',
                  requiredCount: r.requiredCount,
                  skills: r.skills,
                })),
              }}
              submitting={update.isPending}
              error={update.error ? getErrorMessage(update.error) : null}
              onSubmit={async (input) => {
                const saved = await update.mutateAsync(input).catch(() => null);
                if (saved) {
                  success('Project updated');
                  router.push(`/projects/${projectId}`);
                }
              }}
            />
          </>
        )}
      </Page>
    </RequireAuth>
  );
}
