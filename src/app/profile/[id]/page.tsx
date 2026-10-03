'use client';

import { useParams } from 'next/navigation';
import { FiUserX } from 'react-icons/fi';
import { Page } from '@/components/layout/Page';
import { ProfileView } from '@/components/profile/ProfileView';
import { LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useProfile } from '@/hooks/useUsers';
import axios from 'axios';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useProfile(Number(id));
  return (
    <Page>
      {isLoading ? (
        <Skeleton height={320} radius={16} />
      ) : axios.isAxiosError(error) && error.response?.status === 404 ? (
        <EmptyState icon={<FiUserX />} title="User not found" action={<LinkButton href="/teammates">Browse teammates</LinkButton>} />
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <ProfileView profile={data} />
      )}
    </Page>
  );
}
