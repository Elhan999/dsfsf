'use client';

import { useRouter } from 'next/navigation';
import { Page, PageHeader } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ProjectForm } from '@/components/project/ProjectForm';
import { useCreateProject } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/api';

export default function CreateProjectPage() {
  const create = useCreateProject();
  const router = useRouter();
  const { success } = useToast();

  return (
    <RequireAuth>
      <Page>
        <PageHeader eyebrow="New project" title="Create a project" description="Describe your idea, list the roles you need and publish it to the community." />
        <ProjectForm
          mode="create"
          submitting={create.isPending}
          error={create.error ? getErrorMessage(create.error) : null}
          onSubmit={async (input) => {
            const project = await create.mutateAsync(input).catch(() => null);
            if (project) {
              success('Project published', 'People can now discover and apply to it.');
              router.push(`/projects/${project.id}`);
            }
          }}
        />
      </Page>
    </RequireAuth>
  );
}
