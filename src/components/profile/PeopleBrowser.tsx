'use client';

import { useEffect, useState } from 'react';
import { FiUsers, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import styles from '@/components/ui/Filters.module.scss';
import { Pagination } from '@/components/ui/Pagination';
import { SkillPicker } from '@/components/ui/SkillPicker';
import { EmptyState, ErrorState, LoadingLabel } from '@/components/ui/States';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsers } from '@/hooks/useUsers';
import type { Availability, Experience } from '@/types/api';
import { UserCard, UserCardSkeleton, UserGrid } from './UserCard';

const PAGE_SIZE = 12;

export function PeopleBrowser({ search }: { search: string }) {
  const [skills, setSkills] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState<Experience | ''>('');
  const [availability, setAvailability] = useState<Availability | ''>('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const debouncedRole = useDebounce(role.trim());

  useEffect(() => setPage(1), [debouncedSearch, debouncedRole, skills, experience, availability]);

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers({
    search: debouncedSearch || undefined,
    role: debouncedRole || undefined,
    skills,
    experience: experience || undefined,
    availability: availability || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const hasFilters = !!(debouncedSearch || debouncedRole || skills.length || experience || availability);

  const clear = () => {
    setSkills([]);
    setRole('');
    setExperience('');
    setAvailability('');
  };

  return (
    <div>
      <div className={styles.bar}>
        <div className={styles.skills}>
          <SkillPicker label="Skills" value={skills} onChange={setSkills} placeholder="Any skill" existingOnly max={8} />
        </div>
        <Input label="Role" placeholder="e.g. Designer" value={role} onChange={(e) => setRole(e.target.value)} />
        <Select label="Experience" value={experience} onChange={(e) => setExperience(e.target.value as Experience | '')}>
          <option value="">Any level</option>
          <option value="junior">Junior</option>
          <option value="middle">Middle</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead</option>
        </Select>
        <Select label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value as Availability | '')}>
          <option value="">Anyone</option>
          <option value="available">Available</option>
          <option value="part_time">Part-time</option>
          <option value="busy">Busy</option>
        </Select>
      </div>

      <div className={styles.meta}>
        <span>
          {isLoading ? 'Loading people…' : `${data?.pagination.total ?? 0} ${data?.pagination.total === 1 ? 'person' : 'people'}`}
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
          <LoadingLabel>Loading people...</LoadingLabel>
          <UserGrid>
            {Array.from({ length: 6 }, (_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </UserGrid>
        </>
      ) : data?.data.length ? (
        <>
          <UserGrid>
            {data.data.map((u) => (
              <UserCard key={u.id} user={u} highlight={skills} />
            ))}
          </UserGrid>
          <Pagination pagination={data.pagination} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={<FiUsers />}
          title="No people found."
          description="Try different keywords or remove some filters."
          action={hasFilters && <Button variant="secondary" onClick={clear}>Clear filters</Button>}
        />
      )}
    </div>
  );
}
