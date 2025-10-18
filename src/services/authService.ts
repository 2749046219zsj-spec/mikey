import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export const authService = {
  async signUp(email: string, password: string, username?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setProfile(null);
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: { username?: string }) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  initAuthListener() {
    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        const user = session?.user ?? null;
        useAuthStore.getState().setUser(user);

        if (user) {
          try {
            const profile = await authService.getUserProfile(user.id);
            useAuthStore.getState().setProfile(profile);
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        } else {
          useAuthStore.getState().setProfile(null);
        }

        useAuthStore.getState().setLoading(false);
      })();
    });
  }
};
