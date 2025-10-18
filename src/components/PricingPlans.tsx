import React, { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  image_credits: number;
  description: string;
  sort_order: number;
}

interface PricingPlansProps {
  onSelectPlan?: (planId: string) => void;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan }) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    setSelectedPlan(plan.id);

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([
          {
            user_id: user.id,
            plan_id: plan.id,
            payment_status: 'pending',
            payment_amount: plan.price,
            image_credits_purchased: plan.image_credits,
            image_credits_remaining: plan.image_credits,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (onSelectPlan) {
        onSelectPlan(data.id);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('创建订单失败，请重试');
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">选择适合你的套餐</h2>
          <p className="text-gray-600">解锁更多图片生成次数，创作无限可能</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                index === 1
                  ? 'border-blue-500 transform md:scale-105'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles size={14} />
                    推荐
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6 min-h-[40px]">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">¥{plan.price}</span>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <Check size={20} className="text-green-500" />
                    <span className="font-semibold">{plan.image_credits} 张图片额度</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <Check size={20} className="text-green-500" />
                    <span>支持所有模型</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <Check size={20} className="text-green-500" />
                    <span>高清图片下载</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Check size={20} className="text-green-500" />
                    <span>永久有效</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={selectedPlan === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    index === 1
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {selectedPlan === plan.id ? '处理中...' : '立即购买'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>购买后额度永久有效 · 支持微信/支付宝支付</p>
        </div>
      </div>
    </div>
  );
};
