'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from './AppShell';

const BARE_ROUTES = ['/login', '/register'];

/** Auth pages and the guest landing page render full-bleed; everything else gets the app shell. */
export function ShellSwitch({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status } = useAuth();
  const bare = BARE_ROUTES.includes(pathname) || (pathname === '/' && status !== 'authenticated');
  return bare ? <>{children}</> : <AppShell>{children}</AppShell>;
}
