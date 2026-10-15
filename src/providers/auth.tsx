import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, loadStoredSession, onUnauthorized, setToken } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

interface AuthState {
  user: User | null;
  /** True until the stored session has been checked on launch. */
  booting: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; displayName: string; timezone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUserState] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  const clearSession = useCallback(async () => {
    await setToken(null);
    qc.clear();
    setUserState(null);
  }, [qc]);

  useEffect(() => {
    onUnauthorized(() => {
      void clearSession();
    });
    return () => onUnauthorized(null);
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      const token = await loadStoredSession();
      if (token) {
        try {
          setUserState(await api.get<User>('/auth/me'));
        } catch {
          // Expired/invalid token is cleared by the 401 handler; a network failure keeps the
          // stored token so the next launch can retry, but we show the login screen for now.
        }
      }
      setBooting(false);
    })();
  }, []);

  const finish = useCallback(
    async (res: AuthResponse) => {
      qc.clear();
      await setToken(res.token);
      setUserState(res.user);
    },
    [qc],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      booting,
      signIn: async (email, password) =>
        finish(await api.post<AuthResponse>('/auth/login', { email, password }, { noAuthRedirect: true })),
      signUp: async (input) => finish(await api.post<AuthResponse>('/auth/register', input, { noAuthRedirect: true })),
      signOut: clearSession,
      setUser: (u) => {
        setUserState(u);
        qc.invalidateQueries(); // timezone changes how every period is bucketed
      },
    }),
    [user, booting, finish, clearSession, qc],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
