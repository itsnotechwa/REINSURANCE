import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isInsurer: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed role helpers
  const isAdmin = user?.role === 'admin';
  const isInsurer = user?.role === 'insurer';

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.getUserProfile();
        if (response.user) {
          setUser(response.user);
        }
      } catch (error) {
        console.log('No active session');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      if (response.user) {
        setUser(response.user);
        // Verify session is established by fetching profile
        // This ensures the cookie is set and state is synced
        const profileResponse = await api.getUserProfile();
        if (profileResponse.user) {
          setUser(profileResponse.user);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  /**
   * Logout and clear session
   */
  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isInsurer,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
