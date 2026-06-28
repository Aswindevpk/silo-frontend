import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearTokens, getAccessToken } from '@/lib/api';

interface User {
  username: string;
  email: string;
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
        const token = getAccessToken();
        const storedUser = localStorage.getItem('user_profile');
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to parse user profile', error);
        clearTokens();
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

  const logout = () => {
    clearTokens();
    localStorage.removeItem('user_profile');
    setUser(null);
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
