'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { FiFolder, FiSearch, FiUsers } from 'react-icons/fi';
import { Page, PageHeader } from '@/components/layout/Page';
import { PeopleBrowser } from '@/components/profile/PeopleBrowser';
import { ProjectBrowser } from '@/components/project/ProjectBrowser';
import { Input } from '@/components/ui/Field';
import filterStyles from '@/components/ui/Filters.module.scss';
import { Tabs } from '@/components/ui/Tabs';

type Tab = 'projects' | 'people';

function Discover() {
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'people' ? 'people' : 'projects');
  const [search, setSearch] = useState(params.get('q') ?? '');

  const changeTab = (next: Tab) => {
    setTab(next);
    router.replace(`/discover?tab=${next}`, { scroll: false });
  };

  return (
    <Page wide>
      <PageHeader title="Discover" description="Find projects that need your skills, or the people your project needs." />
      <Input
        className={filterStyles.search}
        icon={<FiSearch />}
        placeholder="Search projects, people or skills..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search"
      />
      <Tabs<Tab>
        tabs={[
          { value: 'projects', label: 'Projects', icon: <FiFolder /> },
          { value: 'people', label: 'People', icon: <FiUsers /> },
        ]}
        value={tab}
        onChange={changeTab}
      />
      <div style={{ marginTop: 24 }}>{tab === 'projects' ? <ProjectBrowser search={search} /> : <PeopleBrowser search={search} />}</div>
    </Page>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense>
      <Discover />
    </Suspense>
  );
}
