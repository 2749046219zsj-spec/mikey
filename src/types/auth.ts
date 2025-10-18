export type UserRole = 'user' | 'vip' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}
