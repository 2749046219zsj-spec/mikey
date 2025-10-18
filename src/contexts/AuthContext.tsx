import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { UserWithPermissions } from '../types/user';
import { userService } from '../services/userService';

interface AuthContextType {
  user: UserWithPermissions | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    try {
      const userData = await authService.getUserWithPermissions(userId);
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    authService.getCurrentUser().then(async (currentUser) => {
      if (currentUser) {
        await loadUserData(currentUser.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        await loadUserData(authUser.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { user: authUser } = await authService.login({ email, password });
    if (authUser) {
      await loadUserData(authUser.id);
      try {
        await userService.logAction(authUser.id, 'login');
      } catch (error) {
        console.warn('Failed to log action:', error);
      }
    }
  };

  const register = async (username: string, email: string, password: string) => {
    const { user: authUser } = await authService.register({ username, email, password });
    if (authUser) {
      await loadUserData(authUser.id);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUserData = async () => {
    const currentUser = await authService.getCurrentUser();
    if (currentUser) {
      await loadUserData(currentUser.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUserData }}>
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
