import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types/user';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  updateCredits: (credits: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  updateCredits: (credits) => set((state) =>
    state.profile ? { profile: { ...state.profile, credits_balance: credits } } : {}
  ),
}));
