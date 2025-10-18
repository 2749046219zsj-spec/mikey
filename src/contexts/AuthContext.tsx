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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, is_approved, approval_status')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Profile fetch result:', { profile, profileError, userId: user.id });

      if (profile) {
        console.log('Setting admin status:', profile.is_admin, 'approved:', profile.is_approved, 'status:', profile.approval_status);
        setIsAdmin(profile.is_admin || false);
        setIsApproved(profile.is_approved || false);
        setApprovalStatus(profile.approval_status || 'pending');
      } else {
        console.log('No profile found, setting defaults');
        setIsAdmin(false);
        setIsApproved(false);
        setApprovalStatus('pending');
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, is_approved, approval_status')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            setIsAdmin(profile.is_admin || false);
            setIsApproved(profile.is_approved || false);
            setApprovalStatus(profile.approval_status || 'pending');
          }
        } catch (error) {
          console.error('Error fetching initial profile:', error);
        }
      }

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
      const isAdminEmail = email === '2749046219@qq.com';

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials') && isAdminEmail) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) return { error: signUpError };

          if (signUpData.user) {
            await supabase
              .from('profiles')
              .insert([{
                id: signUpData.user.id,
                email: email,
                full_name: '系统管理员',
                is_admin: true,
                is_approved: true,
                approval_status: 'approved',
                free_credits_granted: true,
              }]);

            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            return { error: signInError };
          }
        }
        return { error };
      }

      if (data.user && isAdminEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile && !profile.is_admin) {
          await supabase
            .from('profiles')
            .update({
              is_admin: true,
              is_approved: true,
              approval_status: 'approved',
            })
            .eq('id', data.user.id);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      return { error: null };
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
