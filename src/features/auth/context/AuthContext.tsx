import React, { createContext, useContext, useState, useEffect } from 'react';
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
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth State from LocalStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
                const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to parse user profile', error);
                localStorage.removeItem('user_profile');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to global logout event from API interceptor
    const handleGlobalLogout = () => {
      logout();
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, []);

  const logout = async () => {
    if (!user) return;
    
    // Clear state immediately to disconnect websockets and unmount protected components
    localStorage.removeItem('user_profile');
    localStorage.removeItem('access_token');
    setUser(null);

    try {
      await api.logout();
    } catch (e) {
      console.error('Failed to hit backend logout', e);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
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
