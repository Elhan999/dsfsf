'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { refreshAccessToken, setSessionListener } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { tokenStore } from '@/lib/tokenStore';
import { authService } from '@/services/auth.service';
import type { AuthSession, UserProfile } from '@/types/api';
import type { LoginValues, RegisterValues } from '@/schemas/auth';

type Status = 'loading' | 'authenticated' | 'guest';

interface AuthContextValue {
  status: Status;
  user: UserProfile | null;
  login: (values: LoginValues) => Promise<UserProfile>;
  register: (values: RegisterValues) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);

  const applySession = useCallback(
    (session: AuthSession | null) => {
      if (session) {
        tokenStore.set(session.accessToken);
        queryClient.setQueryData(queryKeys.me, session.user);
        setUser(session.user);
        setStatus('authenticated');
      } else {
        tokenStore.set(null);
        setUser(null);
        setStatus('guest');
        queryClient.clear();
      }
    },
    [queryClient],
  );

  // Keep `user` in sync with the ['me'] query so profile edits show up everywhere.
  useEffect(() => {
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === queryKeys.me[0] && event.type === 'updated') {
        const data = event.query.state.data as UserProfile | undefined;
        if (data) setUser(data);
      }
    });
  }, [queryClient]);

  // Restore the session from the HTTP-only refresh cookie on first load.
  useEffect(() => {
    setSessionListener((session) => {
      if (session) {
        queryClient.setQueryData(queryKeys.me, session.user);
        setUser(session.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('guest');
      }
    });
    refreshAccessToken();
  }, [queryClient]);

  const login = useCallback(
    async (values: LoginValues) => {
      const session = await authService.login(values);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (values: RegisterValues) => {
      const session = await authService.register(values);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const value = useMemo(() => ({ status, user, login, register, logout }), [status, user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
