import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const PaymentTestPanel: React.FC = () => {
  const { user, refreshCredits } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const simulatePayment = async (subscriptionId: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          payment_status: 'completed',
          purchased_at: new Date().toISOString(),
          transaction_id: `TEST_${Date.now()}`
        })
        .eq('id', subscriptionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await refreshCredits();
      setMessage({ type: 'success', text: '支付成功（测试模式）' });
    } catch (error) {
      console.error('Error simulating payment:', error);
      setMessage({ type: 'error', text: '操作失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const getPendingOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          payment_amount,
          image_credits_purchased,
          created_at,
          pricing_plans(name)
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setMessage({ type: 'error', text: '没有待支付订单' });
        return;
      }

      const pendingOrders = data.map((order: any) => ({
        id: order.id,
        planName: order.pricing_plans?.name || '未知套餐',
        amount: order.payment_amount,
        credits: order.image_credits_purchased,
        date: new Date(order.created_at).toLocaleString('zh-CN')
      }));

      return pendingOrders;
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setMessage({ type: 'error', text: '获取订单失败' });
    } finally {
      setLoading(false);
    }
  };

  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      getPendingOrders().then((orders) => {
        if (orders) setPendingOrders(orders);
      });
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle size={20} className="text-yellow-600" />
        <h3 className="font-bold text-yellow-900">测试面板（仅开发环境）</h3>
      </div>

      <p className="text-sm text-yellow-800 mb-4">
        此面板用于测试支付功能。正式上线前请移除此组件。
      </p>

      {message && (
        <div
          className={`mb-3 p-2 rounded text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        {pendingOrders.length > 0 ? (
          <>
            <p className="text-sm font-semibold text-yellow-900">待支付订单:</p>
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-3 rounded border border-yellow-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{order.planName}</span>
                  <span className="text-sm font-bold">¥{order.amount}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {order.credits} 张图片额度
                </p>
                <button
                  onClick={() => simulatePayment(order.id)}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? '处理中...' : '模拟支付成功'}
                </button>
              </div>
            ))}
          </>
        ) : (
          <p className="text-sm text-gray-600">没有待支付订单</p>
        )}
      </div>

      <button
        onClick={() => {
          getPendingOrders().then((orders) => {
            if (orders) setPendingOrders(orders);
          });
        }}
        className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm font-medium transition-colors"
      >
        刷新订单
      </button>
    </div>
  );
};
