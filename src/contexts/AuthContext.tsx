import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  credits: number;
  refreshCredits: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
  approvalStatus: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('pending');

  const refreshCredits = async () => {
    if (!user) {
      setCredits(0);
      setIsAdmin(false);
      setIsApproved(false);
      setApprovalStatus('pending');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, is_approved, approval_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        setIsAdmin(profile.is_admin || false);
        setIsApproved(profile.is_approved || false);
        setApprovalStatus(profile.approval_status || 'pending');
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('image_credits_remaining')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .gt('image_credits_remaining', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalCredits = data?.reduce((sum, sub) => sum + (sub.image_credits_remaining || 0), 0) || 0;
      setCredits(totalCredits);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(0);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshCredits();
    } else {
      setCredits(0);
    }
  }, [user]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: email,
              full_name: fullName || '',
            },
          ]);

        if (profileError) console.error('Profile creation error:', profileError);
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    credits,
    refreshCredits,
    isAdmin,
    isApproved,
    approvalStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
