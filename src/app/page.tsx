'use client';

import { Dashboard } from '@/components/home/Dashboard';
import { Landing } from '@/components/home/Landing';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  return status === 'authenticated' ? <Dashboard /> : <Landing />;
}
