import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginRequest, RegisterRequest, AuthTokens, ApiResponse } from '@nx-shay/shared';
import { setTokens, clearTokens, getAccessToken, apiGet } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const response = await apiGet<User>('/api/users/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to restore session:', error);
          clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  async function postAuth(endpoint: string, body: LoginRequest | RegisterRequest, fallbackMessage: string) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: fallbackMessage }));
      throw new Error(errorData.message || fallbackMessage);
    }

    const data: ApiResponse<{ user: User; tokens: AuthTokens }> = await response.json();
    setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
    setUser(data.data.user);
  }

  const login = async (username: string, password: string) => {
    await postAuth('/api/auth/login', { username, password }, 'Login failed');
  };

  const register = async (username: string, password: string) => {
    await postAuth('/api/auth/register', { username, password }, 'Registration failed');
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
