import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '@/types';
import { authApi } from '@/api/authApi';

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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Cache check only - real validation happens in useEffect
    const stored = localStorage.getItem('rt_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('rt_token');
      if (!token) {
        setUser(null);
        localStorage.removeItem('rt_user');
        setIsInitializing(false);
        return;
      }

      try {
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
        setUser(null);
        localStorage.removeItem('rt_token');
        localStorage.removeItem('rt_user');
        // Axios interceptor handles the actual redirect to /login
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
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
    return <div className="min-h-screen flex items-center justify-center bg-background text-text-muted">Loading application...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
