import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '@/types';
import { authApi } from '@/api/authApi';
import { waitForBackendReady } from '@/lib/backendReadiness';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isInitializing: boolean;
  backendStatus: 'checking' | 'ready' | 'unavailable';
  backendMessage: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Cache check only - real validation happens in useEffect
    const stored = localStorage.getItem('rt_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const [backendMessage, setBackendMessage] = useState('Starting RecruitTrack server...');

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        const isReady = await waitForBackendReady((snapshot) => {
          if (cancelled) {
            return;
          }

          setBackendStatus(snapshot.status);
          if (snapshot.status === 'checking') {
            setBackendMessage('The server is waking up. This may take a moment.');
          } else if (snapshot.status === 'ready') {
            setBackendMessage('');
          } else {
            setBackendMessage('RecruitTrack server is currently unavailable. Please try again.');
          }
        });

        if (cancelled) {
          return;
        }

        if (!isReady) {
          setUser(null);
          localStorage.removeItem('rt_token');
          localStorage.removeItem('rt_user');
          return;
        }

        const token = localStorage.getItem('rt_token');
        if (!token) {
          setUser(null);
          localStorage.removeItem('rt_user');
          return;
        }

        const response = await authApi.getCurrentUser();
        const apiUser = response.data;

        const validatedUser = {
          id: apiUser.id,
          name: `${apiUser.firstName} ${apiUser.lastName}`,
          email: apiUser.email,
          role: apiUser.role?.toUpperCase() as UserRole,
          initials: `${apiUser.firstName[0]}${apiUser.lastName[0]}`,
          avatarUrl: apiUser.avatarUrl,
        };

        setUser(validatedUser);
        localStorage.setItem('rt_user', JSON.stringify(validatedUser));
      } catch (e) {
        if (!cancelled) {
          setUser(null);
          localStorage.removeItem('rt_token');
          localStorage.removeItem('rt_user');
        }
        // Axios interceptor handles the actual redirect to /login
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (backendStatus !== 'ready') {
      throw new Error('RecruitTrack server is currently unavailable. Please try again.');
    }

    const response = await authApi.login(email, password);
    const apiUser = response.data.user;
    
    localStorage.setItem('rt_token', response.data.token);
    
    const loggedInUser = {
      id: apiUser.id,
      name: `${apiUser.firstName} ${apiUser.lastName}`,
      email: apiUser.email,
      role: apiUser.role?.toUpperCase() as UserRole,
      initials: `${apiUser.firstName[0]}${apiUser.lastName[0]}`,
      avatarUrl: apiUser.avatarUrl,
    };
    
    setUser(loggedInUser);
    localStorage.setItem('rt_user', JSON.stringify(loggedInUser));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      setUser(null);
      localStorage.removeItem('rt_token');
      localStorage.removeItem('rt_user');
      window.location.replace('/login');
    }
  };

  if (isInitializing) {
    if (backendStatus !== 'checking') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="w-full max-w-sm rounded-lg border border-border bg-white px-6 py-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-border border-t-primary animate-spin" />
              <div>
                <div className="text-sm font-medium text-text">Loading application...</div>
                <div className="text-sm text-text-muted">Preparing your session.</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-border border-t-primary animate-spin" />
            <div>
              <div className="text-sm font-medium text-text">Starting RecruitTrack server...</div>
              <div className="text-sm text-text-muted">{backendMessage || 'The server is waking up. This may take a moment.'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user, isInitializing, backendStatus, backendMessage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
