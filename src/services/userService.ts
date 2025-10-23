import { supabase } from '../lib/supabase';
import { UserProfile, UserPermissions, UsageLog } from '../types/user';

export const userService = {
  async logAction(userId: string, actionType: string, details: Record<string, any> = {}) {
    const { error } = await supabase
      .from('usage_logs')
      .insert([{ user_id: userId, action_type: actionType, details }]);

    if (error) throw error;
  },

  async decrementDraws(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('decrement_remaining_draws', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data as boolean;
  },

  async getUserLogs(userId: string, limit: number = 50): Promise<UsageLog[]> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

export const adminService = {
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserPermissions(userId: string, updates: Partial<UserPermissions>) {
    const { data, error } = await supabase
      .from('user_permissions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    return this.updateUserProfile(userId, { is_active: isActive });
  },

  async getUserLogs(userId: string, limit: number = 100): Promise<UsageLog[]> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getAllUsageLogs(limit: number = 200): Promise<UsageLog[]> {
    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getUserStats(userId: string) {
    const logs = await this.getUserLogs(userId, 1000);

    const stats = {
      totalActions: logs.length,
      drawCount: logs.filter(log => log.action_type === 'draw').length,
      chatCount: logs.filter(log => log.action_type === 'chat').length,
      loginCount: logs.filter(log => log.action_type === 'login').length,
      lastActivity: logs[0]?.created_at || null,
    };

    return stats;
  },

  async resetUserPassword(userId: string, newPassword: string) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    return await response.json();
  },

  async updateUserQuota(userId: string, imageQuota: number) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ image_quota: imageQuota })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserQuotaInfo(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('image_quota, images_saved')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
