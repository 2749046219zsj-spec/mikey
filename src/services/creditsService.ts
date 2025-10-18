import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export const creditsService = {
  async deductCredits(userId: string, amount: number, description: string) {
    const profile = useAuthStore.getState().profile;
    if (!profile) throw new Error('User profile not found');

    if (profile.credits_balance < amount) {
      throw new Error('积分不足，请先充值');
    }

    const newBalance = profile.credits_balance - amount;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ credits_balance: newBalance })
      .eq('id', userId);

    if (profileError) throw profileError;

    const { error: historyError } = await supabase
      .from('credits_history')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'consumption',
        description,
        balance_after: newBalance
      });

    if (historyError) throw historyError;

    useAuthStore.getState().updateCredits(newBalance);

    return newBalance;
  },

  async addCredits(userId: string, amount: number, type: string, description: string) {
    const profile = useAuthStore.getState().profile;
    if (!profile) throw new Error('User profile not found');

    const newBalance = profile.credits_balance + amount;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ credits_balance: newBalance })
      .eq('id', userId);

    if (profileError) throw profileError;

    const { error: historyError } = await supabase
      .from('credits_history')
      .insert({
        user_id: userId,
        amount,
        type,
        description,
        balance_after: newBalance
      });

    if (historyError) throw historyError;

    useAuthStore.getState().updateCredits(newBalance);

    return newBalance;
  },

  async checkIn(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: existingCheckin } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .maybeSingle();

    if (existingCheckin) {
      throw new Error('今天已经签到过了');
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: lastCheckin } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    let streakDays = 1;
    let creditsAwarded = 10;

    if (lastCheckin && lastCheckin.checkin_date === yesterdayStr) {
      streakDays = lastCheckin.streak_days + 1;
      creditsAwarded = Math.min(10 + Math.floor(streakDays / 7) * 5, 30);
    }

    const { error: checkinError } = await supabase
      .from('daily_checkins')
      .insert({
        user_id: userId,
        checkin_date: today,
        credits_awarded: creditsAwarded,
        streak_days: streakDays
      });

    if (checkinError) throw checkinError;

    await this.addCredits(
      userId,
      creditsAwarded,
      'checkin',
      `每日签到奖励 (连续${streakDays}天)`
    );

    return { creditsAwarded, streakDays };
  },

  async getCheckinStatus(userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const { data: todayCheckin } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .maybeSingle();

    const { data: lastCheckin } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      hasCheckedInToday: !!todayCheckin,
      streakDays: lastCheckin?.streak_days || 0,
      lastCheckinDate: lastCheckin?.checkin_date
    };
  }
};
