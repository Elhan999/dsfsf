'use client';

import { useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { Page, PageHeader } from '@/components/layout/Page';
import { ProjectBrowser } from '@/components/project/ProjectBrowser';
import { LinkButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import filterStyles from '@/components/ui/Filters.module.scss';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  return (
    <Page wide>
      <PageHeader
        title="Projects"
        description="Every project on Team Finder. Filter by the skills and roles you care about."
        actions={
          <LinkButton href="/projects/create" icon={<FiPlus />}>
            Create project
          </LinkButton>
        }
      />
      <Input className={filterStyles.search} icon={<FiSearch />} placeholder="Search projects, roles or skills..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search projects" />
      <ProjectBrowser search={search} />
    </Page>
  );
}
