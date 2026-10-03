'use client';

import { useEffect, useState } from 'react';
import { FiFolder, FiX } from 'react-icons/fi';
import { Button, LinkButton } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import styles from '@/components/ui/Filters.module.scss';
import { Pagination } from '@/components/ui/Pagination';
import { SkillPicker } from '@/components/ui/SkillPicker';
import { EmptyState, ErrorState, LoadingLabel } from '@/components/ui/States';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategories, useProjects } from '@/hooks/useProjects';
import type { ProjectStatus } from '@/types/api';
import { ProjectCard, ProjectCardSkeleton, ProjectGrid } from './ProjectCard';

const PAGE_SIZE = 12;

/** Server-side search + filters + pagination for projects. `search` may be controlled by a parent. */
export function ProjectBrowser({ search }: { search: string }) {
  const [skills, setSkills] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const debouncedRole = useDebounce(role.trim());
  const categories = useCategories();

  useEffect(() => setPage(1), [debouncedSearch, debouncedRole, skills, category, status]);

  const filters = {
    search: debouncedSearch || undefined,
    role: debouncedRole || undefined,
    skills,
    category: category || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  };
  const { data, isLoading, isError, error, refetch, isFetching } = useProjects(filters);
  const hasFilters = !!(debouncedSearch || debouncedRole || skills.length || category || status);

  const clear = () => {
    setSkills([]);
    setRole('');
    setCategory('');
    setStatus('');
  };

  return (
    <div>
      <div className={styles.bar}>
        <div className={styles.skills}>
          <SkillPicker label="Skills" value={skills} onChange={setSkills} placeholder="Any skill" existingOnly max={8} />
        </div>
        <Input label="Role" placeholder="e.g. Frontend" value={role} onChange={(e) => setRole(e.target.value)} />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | '')}>
          <option value="">Any status</option>
          <option value="recruiting">Recruiting</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
        </Select>
      </div>

      <div className={styles.meta}>
        <span>
          {isLoading ? 'Loading projects…' : `${data?.pagination.total ?? 0} ${data?.pagination.total === 1 ? 'project' : 'projects'}`}
          {isFetching && !isLoading && ' · updating…'}
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" icon={<FiX />} onClick={clear}>
            Clear filters
          </Button>
        )}
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <>
          <LoadingLabel>Loading projects...</LoadingLabel>
          <ProjectGrid>
            {Array.from({ length: 6 }, (_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </ProjectGrid>
        </>
      ) : data?.data.length ? (
        <>
          <ProjectGrid>
            {data.data.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </ProjectGrid>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<FiFolder />}
          title="No projects found."
          description={hasFilters ? 'Try different keywords or remove some filters.' : 'Be the first to publish a project.'}
          action={hasFilters ? <Button variant="secondary" onClick={clear}>Clear filters</Button> : <LinkButton href="/projects/create">Create a project</LinkButton>}
        />
      )}
    </div>
  );
}
