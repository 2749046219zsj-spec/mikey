import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useCredits = () => {
  const { user, credits, refreshCredits } = useAuth();
  const [isDeducting, setIsDeducting] = useState(false);

  const deductCredits = useCallback(async (
    amount: number = 1,
    promptText?: string,
    imageUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: '请先登录' };
    }

    if (credits < amount) {
      return { success: false, error: '额度不足，请购买套餐' };
    }

    setIsDeducting(true);

    try {
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id, image_credits_remaining')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .gt('image_credits_remaining', 0)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!subscription) {
        return { success: false, error: '没有可用的套餐' };
      }

      if (subscription.image_credits_remaining < amount) {
        return { success: false, error: '当前套餐额度不足' };
      }

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          image_credits_remaining: subscription.image_credits_remaining - amount,
        })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('usage_logs')
        .insert([
          {
            user_id: user.id,
            subscription_id: subscription.id,
            action_type: 'image_generation',
            credits_used: amount,
            prompt_text: promptText,
            image_url: imageUrl,
          },
        ]);

      if (logError) throw logError;

      await refreshCredits();

      return { success: true };
    } catch (error) {
      console.error('Error deducting credits:', error);
      return { success: false, error: '扣除额度失败，请重试' };
    } finally {
      setIsDeducting(false);
    }
  }, [user, credits, refreshCredits]);

  return {
    credits,
    deductCredits,
    isDeducting,
  };
};
