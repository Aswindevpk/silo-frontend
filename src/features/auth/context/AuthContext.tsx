import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  default_workspace_slug?: string | null;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate the httpOnly session cookie against the backend
  const checkAuth = useCallback(async () => {
    try {
      // Assumes api.getProfile() or api.getMe() hits an endpoint like GET /auth/me
      const response = await api.getProfile(); 
      setUser(response);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear the cookie on the server (e.g., Set-Cookie: token=; Max-Age=0; HttpOnly)
      await api.logout();
    } catch (e) {
      console.error('Failed to logout on backend', e);
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen to global 401/403 logout events triggered by API interceptors
    const handleGlobalLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, [checkAuth]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        checkAuth,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
