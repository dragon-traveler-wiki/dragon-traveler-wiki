import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  deleteAccount as apiDeleteAccount,
  getCurrentUser,
  getOAuthUrl,
  isCommunityApiConfigured,
  logout as apiLogout,
  setPrimaryIdentity,
  unlinkIdentity,
} from './api';
import type { CommunityUser } from './types';

interface AuthContextValue {
  user: CommunityUser | null;
  csrfToken: string | null;
  configured: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (provider: 'discord' | 'github') => void;
  link: (provider: 'discord' | 'github') => void;
  unlink: (provider: 'discord' | 'github') => Promise<void>;
  setPrimary: (provider: 'discord' | 'github') => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function CommunityAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CommunityUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isCommunityApiConfigured) {
      setUser(null);
      setCsrfToken(null);
      setLoading(false);
      return;
    }
    try {
      const result = await getCurrentUser();
      setUser(result.user);
      setCsrfToken(result.csrfToken ?? null);
    } catch {
      // A failed check (offline, server error) keeps whatever we already had
      // rather than signing the person out in the UI; an actual signed-out
      // session comes back as a successful `user: null` response instead.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  // Keep alert counts current while the site stays open: re-check when the tab
  // regains focus, and every minute for moderators watching the report queue.
  const signedInId = user?.id;
  const isModerator = user?.role === 'moderator';
  useEffect(() => {
    if (!signedInId) return;
    let lastChecked = Date.now();
    const refreshIfStale = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastChecked < 30_000) return;
      lastChecked = Date.now();
      void refresh();
    };
    document.addEventListener('visibilitychange', refreshIfStale);
    window.addEventListener('focus', refreshIfStale);
    const timer = isModerator
      ? window.setInterval(refreshIfStale, 60_000)
      : undefined;
    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale);
      window.removeEventListener('focus', refreshIfStale);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [signedInId, isModerator, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      csrfToken,
      configured: isCommunityApiConfigured,
      loading,
      refresh,
      login: (provider) => {
        if (!isCommunityApiConfigured) return;
        window.location.assign(getOAuthUrl(provider));
      },
      link: (provider) => {
        if (!isCommunityApiConfigured) return;
        window.location.assign(getOAuthUrl(provider, 'link'));
      },
      unlink: async (provider) => {
        if (!csrfToken) return;
        await unlinkIdentity(provider, csrfToken);
        await refresh();
      },
      setPrimary: async (provider) => {
        if (!csrfToken) return;
        await setPrimaryIdentity(provider, csrfToken);
        await refresh();
      },
      logout: async () => {
        if (csrfToken) await apiLogout(csrfToken);
        setUser(null);
        setCsrfToken(null);
      },
      deleteAccount: async () => {
        if (!csrfToken) return;
        await apiDeleteAccount(csrfToken);
        setUser(null);
        setCsrfToken(null);
      },
    }),
    [csrfToken, loading, refresh, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommunityAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value)
    throw new Error(
      'useCommunityAuth must be used inside CommunityAuthProvider',
    );
  return value;
}
