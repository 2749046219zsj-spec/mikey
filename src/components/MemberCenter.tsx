import { useState, useEffect } from 'react';
import { User, CreditCard, History, LogOut, Gift, Award } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';
import { CreditsHistory, Transaction } from '../types/user';

export default function MemberCenter() {
  const { profile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'credits' | 'transactions'>('profile');
  const [creditsHistory, setCreditsHistory] = useState<CreditsHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'credits' && user) {
      loadCreditsHistory();
    } else if (activeTab === 'transactions' && user) {
      loadTransactions();
    }
  }, [activeTab, user]);

  const loadCreditsHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credits_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCreditsHistory(data || []);
    } catch (error) {
      console.error('Error loading credits history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!profile) {
    return null;
  }

  const getTierBadge = (tier: string) => {
    const badges = {
      free: { label: '免费会员', color: 'bg-gray-100 text-gray-700' },
      basic: { label: '入门会员', color: 'bg-blue-100 text-blue-700' },
      advanced: { label: '进阶会员', color: 'bg-green-100 text-green-700' },
      premium: { label: '高级会员', color: 'bg-yellow-100 text-yellow-700' }
    };
    const badge = badges[tier as keyof typeof badges] || badges.free;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: '充值',
      consumption: '消费',
      bonus: '奖励',
      admin_adjust: '管理员调整',
      checkin: '签到',
      refund: '退款'
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      pending: { label: '待支付', color: 'text-yellow-600' },
      completed: { label: '已完成', color: 'text-green-600' },
      failed: { label: '失败', color: 'text-red-600' },
      refunded: { label: '已退款', color: 'text-gray-600' }
    };
    const statusInfo = labels[status] || labels.pending;
    return <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">会员中心</h1>
              <p className="text-blue-100">{profile.email}</p>
              <p className="text-blue-100 text-sm mt-1">
                用户名: {profile.username || '未设置'}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>退出登录</span>
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            {getTierBadge(profile.membership_tier)}
            {profile.is_admin && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                管理员
              </span>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white p-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">当前积分</div>
              <div className="text-4xl font-bold text-blue-600">{profile.credits_balance}</div>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            累计消费: ¥{profile.total_spent.toFixed(2)}
          </div>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-5 h-5 inline mr-2" />
              个人信息
            </button>
            <button
              onClick={() => setActiveTab('credits')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'credits'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Gift className="w-5 h-5 inline mr-2" />
              积分明细
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-5 h-5 inline mr-2" />
              消费记录
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">邮箱地址</div>
                <div className="font-medium">{profile.email}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">用户名</div>
                <div className="font-medium">{profile.username || '未设置'}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">会员等级</div>
                <div>{getTierBadge(profile.membership_tier)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">注册时间</div>
                <div className="font-medium">
                  {new Date(profile.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : creditsHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无积分记录</div>
              ) : (
                <div className="space-y-3">
                  {creditsHistory.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{getTypeLabel(item.type)}</span>
                          <span className={`font-bold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.amount > 0 ? '+' : ''}{item.amount}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          余额: {item.balance_after} | {new Date(item.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无消费记录</div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">充值套餐</div>
                          <div className="text-sm text-gray-600">
                            获得积分: +{tx.credits_awarded}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-800">
                            ¥{tx.amount.toFixed(2)}
                          </div>
                          {getStatusLabel(tx.payment_status)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>支付方式: {tx.payment_method}</span>
                        <span>{new Date(tx.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
