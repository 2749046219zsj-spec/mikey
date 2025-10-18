import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WeChatPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: number;
  credits: number;
}

const QR_CODE_IMAGES: { [key: number]: string } = {
  39: '/image copy copy copy.png',
  79: '/image copy copy.png',
  99: '/image copy.png',
};

export const WeChatPayment: React.FC<WeChatPaymentProps> = ({
  isOpen,
  onClose,
  planId,
  planName,
  price,
  credits,
}) => {
  const { user, refreshCredits } = useAuth();
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  React.useEffect(() => {
    if (isOpen && user) {
      createSubscription();
    }
  }, [isOpen, user]);

  const createSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([
          {
            user_id: user.id,
            plan_id: planId,
            payment_status: 'pending',
            payment_amount: price,
            image_credits_purchased: credits,
            image_credits_remaining: credits,
            qr_code_url: QR_CODE_IMAGES[price] || '',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setSubscriptionId(data.id);
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('创建订单失败，请重试');
      onClose();
    }
  };

  const checkPaymentStatus = async () => {
    if (!subscriptionId) return;

    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('payment_status')
        .eq('id', subscriptionId)
        .single();

      if (error) throw error;

      if (data.payment_status === 'completed') {
        await refreshCredits();
        alert('支付成功！额度已到账');
        onClose();
      } else {
        alert('暂未检测到支付，请完成支付后再次查询');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      alert('查询失败，请重试');
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  const qrCodeUrl = QR_CODE_IMAGES[price];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">微信支付</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{planName}</h3>
            <p className="text-gray-600 text-sm mb-4">{credits} 张图片生成额度</p>
            <div className="text-4xl font-bold text-green-600 mb-2">¥{price}</div>
          </div>

          <div className="bg-green-50 rounded-xl p-6 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="微信支付二维码"
                  className="w-full h-auto mx-auto"
                  style={{ maxWidth: '300px' }}
                />
              ) : (
                <div className="w-64 h-64 bg-gray-200 flex items-center justify-center mx-auto">
                  <p className="text-gray-500 text-sm">二维码加载中...</p>
                </div>
              )}
            </div>
            <p className="text-center text-green-700 text-sm mt-4 font-medium">
              使用微信扫描二维码完成支付
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">支付说明：</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>使用微信扫描上方二维码</li>
                    <li>完成支付后点击"我已完成支付"</li>
                    <li>系统将自动为您充值额度</li>
                  </ol>
                </div>
              </div>
            </div>

            <button
              onClick={checkPaymentStatus}
              disabled={checking}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? '查询中...' : '我已完成支付'}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              取消支付
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            如有问题，请联系客服
          </p>
        </div>
      </div>
    </div>
  );
};
