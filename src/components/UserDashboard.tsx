import React, { useEffect, useState } from 'react';
import { User, CreditCard, Image as ImageIcon, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PricingPlans } from './PricingPlans';

interface UsageLog {
  id: string;
  created_at: string;
  prompt_text: string;
  credits_used: number;
}

interface Subscription {
  id: string;
  payment_amount: number;
  image_credits_purchased: number;
  image_credits_remaining: number;
  purchased_at: string;
  plan_name: string;
}

export const UserDashboard: React.FC = () => {
  const { user, signOut, credits, refreshCredits } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'buy'>('overview');
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [logsResult, subsResult] = await Promise.all([
        supabase
          .from('usage_logs')
          .select('id, created_at, prompt_text, credits_used')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_subscriptions')
          .select(`
            id,
            payment_amount,
            image_credits_purchased,
            image_credits_remaining,
            purchased_at,
            pricing_plans(name)
          `)
          .eq('user_id', user.id)
          .eq('payment_status', 'completed')
          .order('purchased_at', { ascending: false }),
      ]);

      if (logsResult.data) setUsageLogs(logsResult.data);

      if (subsResult.data) {
        const formattedSubs = subsResult.data.map((sub: any) => ({
          ...sub,
          plan_name: sub.pricing_plans?.name || '未知套餐',
        }));
        setSubscriptions(formattedSubs);
      }

      await refreshCredits();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">请先登录</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.email}</h1>
                  <p className="text-blue-100 mt-1">会员中心</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>退出登录</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <ImageIcon size={20} />
                  <span className="text-sm">剩余额度</span>
                </div>
                <p className="text-3xl font-bold">{credits}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <CreditCard size={20} />
                  <span className="text-sm">已购买</span>
                </div>
                <p className="text-3xl font-bold">{subscriptions.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <ImageIcon size={20} />
                  <span className="text-sm">已使用</span>
                </div>
                <p className="text-3xl font-bold">{usageLogs.length}</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-4 text-center font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                概览
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-center font-semibold transition-colors ${
                  activeTab === 'history'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                使用记录
              </button>
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 py-4 text-center font-semibold transition-colors ${
                  activeTab === 'buy'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                购买套餐
              </button>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">购买记录</h3>
                    {subscriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">还没有购买记录</p>
                        <button
                          onClick={() => setActiveTab('buy')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                        >
                          立即购买
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subscriptions.map((sub) => (
                          <div
                            key={sub.id}
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg mb-2">
                                  {sub.plan_name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                  购买时间: {new Date(sub.purchased_at).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                  ¥{sub.payment_amount}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  剩余 {sub.image_credits_remaining} / {sub.image_credits_purchased} 张
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">使用记录</h3>
                    {usageLogs.length === 0 ? (
                      <div className="text-center py-12">
                        <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">还没有使用记录</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {usageLogs.map((log) => (
                          <div
                            key={log.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-gray-900 font-medium line-clamp-2">
                                  {log.prompt_text || '图片生成'}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                  {new Date(log.created_at).toLocaleString('zh-CN')}
                                </p>
                              </div>
                              <span className="text-red-600 font-semibold ml-4">
                                -{log.credits_used}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'buy' && (
                  <div>
                    <PricingPlans
                      onSelectPlan={(subscriptionId) => {
                        alert('订单创建成功！请联系客服完成支付。订单ID: ' + subscriptionId);
                        fetchData();
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
