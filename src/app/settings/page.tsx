'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { Page, PageHeader } from '@/components/layout/Page';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { SkillsEditor } from '@/components/profile/SkillsEditor';
import { Button, LinkButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useUsers';
import styles from './settings.module.scss';

function Settings() {
  const { data: me, isLoading, isError, error, refetch } = useProfile();
  const { logout } = useAuth();
  const router = useRouter();
  const welcome = useSearchParams().get('welcome');

  return (
    <Page>
      <PageHeader
        eyebrow={welcome ? 'Welcome to Team Finder 👋' : undefined}
        title={welcome ? 'Set up your profile' : 'Settings'}
        description={welcome ? 'Add your role and skills so projects and people can find you.' : 'Manage your public profile, skills and account.'}
        actions={welcome && <LinkButton href="/discover">Continue to Discover</LinkButton>}
      />
      {isLoading ? (
        <Skeleton height={480} radius={16} />
      ) : isError || !me ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className={styles.sections}>
          <section className={styles.card}>
            <header>
              <h2>Skills</h2>
              <p>Used for search, recommendations and AI matching. Changes save instantly.</p>
            </header>
            <SkillsEditor skills={me.skills} />
          </section>
          <section className={styles.card}>
            <header>
              <h2>Profile</h2>
              <p>This information is visible on your public profile.</p>
            </header>
            <ProfileForm key={me.id} profile={me} />
          </section>
          <section className={styles.card}>
            <header>
              <h2>Account</h2>
              <p>Signed in as {me.email}</p>
            </header>
            <div>
              <Button
                variant="danger"
                icon={<FiLogOut />}
                onClick={async () => {
                  await logout();
                  router.push('/');
                }}
              >
                Log out
              </Button>
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Suspense>
        <Settings />
      </Suspense>
    </RequireAuth>
  );
}
