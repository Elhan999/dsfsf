'use client';

import { useState } from 'react';
import { FiCpu, FiSearch } from 'react-icons/fi';
import { Page, PageHeader } from '@/components/layout/Page';
import { PeopleBrowser } from '@/components/profile/PeopleBrowser';
import { LinkButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import filterStyles from '@/components/ui/Filters.module.scss';

export default function TeammatesPage() {
  const [search, setSearch] = useState('');
  return (
    <Page wide>
      <PageHeader
        title="Find teammates"
        description="Developers, designers and makers looking for their next project."
        actions={
          <LinkButton href="/ai-match" variant="secondary" icon={<FiCpu />}>
            Match with AI
          </LinkButton>
        }
      />
      <Input className={filterStyles.search} icon={<FiSearch />} placeholder="Search by name, role or skill..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search people" />
      <PeopleBrowser search={search} />
    </Page>
  );
}
