import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  employee_id?: number;
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    require_2fa?: boolean;
    email?: string
  }>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      const storedToken = localStorage.getItem('sessionToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setSessionToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify session is still valid
        const isValid = await verifySession(storedToken);
        if (!isValid) {
          // Clear invalid session
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('user');
          setSessionToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const verifySession = async (token?: string): Promise<boolean> => {
    const tokenToVerify = token || sessionToken;
    if (!tokenToVerify) return false;

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as { authenticated: boolean; user: any };
        if (data.authenticated) {
          setUser(data.user);
          // Update localStorage with latest user data
          localStorage.setItem('user', JSON.stringify(data.user));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Session verification error:', error);
      return false;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json() as {
        success: boolean;
        sessionToken?: string;
        user?: any;
        error?: string;
        require_2fa?: boolean;
        email?: string;
      };

      if (response.ok && data.success) {
        // CASE: 2FA REQUIRED
        if (data.require_2fa) {
          return {
            success: true,
            require_2fa: true,
            email: data.email
          };
        }

        // CASE: STANDARD LOGIN (or verified session returned immediately)
        // Store session data
        localStorage.setItem('sessionToken', data.sessionToken!);
        localStorage.setItem('user', JSON.stringify(data.user));

        setSessionToken(data.sessionToken!);
        setUser(data.user);

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear local storage and state
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    setSessionToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, sessionToken, isLoading, login, logout, verifySession }}>
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
