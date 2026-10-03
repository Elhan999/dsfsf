'use client';

import { Page } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ProfileView } from '@/components/profile/ProfileView';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useProfile } from '@/hooks/useUsers';

function MyProfile() {
  const { data, isLoading, isError, error, refetch } = useProfile();
  return (
    <Page>
      {isLoading ? <Skeleton height={320} radius={16} /> : isError || !data ? <ErrorState error={error} onRetry={() => refetch()} /> : <ProfileView profile={data} />}
    </Page>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <MyProfile />
    </RequireAuth>
  );
}
