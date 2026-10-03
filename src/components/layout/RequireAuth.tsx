'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import styles from './RequireAuth.module.scss';

/** Client-side guard; the API enforces permissions regardless. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'guest') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return (
      <div className={styles.wrap} role="status">
        <span className={styles.spinner} aria-hidden />
        <span className="visually-hidden">Loading…</span>
      </div>
    );
  }
  return <>{children}</>;
}
