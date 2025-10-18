import { useState, useEffect } from 'react';
import { X, CreditCard, Zap, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Package } from '../types/user';
import { useAuthStore } from '../stores/authStore';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RechargeModal({ isOpen, onClose }: RechargeModalProps) {
  const { user, profile } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user || !profile) return;

    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setProcessing(true);
    try {
      const transactionNo = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          package_id: pkg.id,
          amount: pkg.price,
          credits_awarded: pkg.credits,
          payment_status: 'completed',
          payment_method: 'demo',
          transaction_no: transactionNo
        })
        .select()
        .single();

      if (txError) throw txError;

      const newBalance = profile.credits_balance + pkg.credits;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          credits_balance: newBalance,
          membership_tier: pkg.tier,
          total_spent: profile.total_spent + pkg.price
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: historyError } = await supabase
        .from('credits_history')
        .insert({
          user_id: user.id,
          amount: pkg.credits,
          type: 'purchase',
          description: `充值 ${pkg.name}`,
          balance_after: newBalance,
          related_transaction_id: transaction.id
        });

      if (historyError) throw historyError;

      const updatedProfile = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedProfile.data) {
        useAuthStore.getState().setProfile(updatedProfile.data);
      }

      alert(`充值成功！获得 ${pkg.credits} 积分`);
      onClose();
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert('充值失败: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const getTierBadge = (tier: string) => {
    const badges = {
      basic: { label: '入门', color: 'bg-blue-100 text-blue-700', icon: '🌟' },
      advanced: { label: '进阶', color: 'bg-green-100 text-green-700', icon: '⭐' },
      premium: { label: '高级', color: 'bg-yellow-100 text-yellow-700', icon: '✨' }
    };
    return badges[tier as keyof typeof badges] || badges.basic;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">选择充值套餐</h2>
            <p className="text-sm text-gray-600 mt-1">开通会员，解锁更多功能</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const badge = getTierBadge(pkg.tier);
                const isSelected = selectedPackage === pkg.id;
                const perCreditPrice = (pkg.price / pkg.credits).toFixed(3);

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className="text-center">
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {pkg.name}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                        {badge.label}会员
                      </span>

                      <div className="my-6">
                        <div className="text-4xl font-bold text-gray-800">
                          ¥{pkg.price}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          单价 ¥{perCreditPrice}/积分
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <Zap className="w-5 h-5" />
                          <span className="text-2xl font-bold">{pkg.credits}</span>
                          <span className="text-sm">积分</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-left">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">立即到账 {pkg.credits} 积分</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">升级至 {badge.label}会员</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">永久有效，无时间限制</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && packages.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handlePurchase}
                disabled={!selectedPackage || processing}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                <CreditCard className="w-6 h-6" />
                {processing ? '处理中...' : '立即充值'}
              </button>
            </div>
          )}

          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h4 className="font-medium text-gray-800 mb-3">充值说明</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 积分用于使用 AI 生成功能，每次生成消耗相应积分</li>
              <li>• 充值的积分永久有效，不会过期</li>
              <li>• 会员等级越高，享受的服务越优质</li>
              <li>• 当前为演示模式，点击充值后积分将直接到账</li>
              <li>• 如有问题，请联系客服处理</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
