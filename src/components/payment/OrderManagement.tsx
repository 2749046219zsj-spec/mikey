import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import type { PaymentOrder } from '../../types/payment';

export const OrderManagement: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await paymentService.getUserOrders(user.id);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, text: '待支付', color: 'text-yellow-600 bg-yellow-50' };
      case 'paid':
        return { icon: CheckCircle, text: '已支付', color: 'text-green-600 bg-green-50' };
      case 'failed':
        return { icon: XCircle, text: '支付失败', color: 'text-red-600 bg-red-50' };
      case 'refunded':
        return { icon: RefreshCw, text: '已退款', color: 'text-blue-600 bg-blue-50' };
      case 'cancelled':
        return { icon: XCircle, text: '已取消', color: 'text-gray-600 bg-gray-50' };
      default:
        return { icon: Clock, text: status, color: 'text-gray-600 bg-gray-50' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">我的订单</h2>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span>刷新</span>
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Clock size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600">暂无订单记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm text-gray-500">订单号：{order.order_no}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${statusInfo.color}`}>
                        <StatusIcon size={16} />
                        <span>{statusInfo.text}</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      创建时间：{formatDate(order.created_at)}
                    </p>
                    {order.paid_at && (
                      <p className="text-xs text-gray-400">
                        支付时间：{formatDate(order.paid_at)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">¥{order.amount}</p>
                    <p className="text-sm text-gray-500">{order.draw_count}次绘图</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">支付方式</p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.payment_method === 'wechat' ? '微信支付' : '支付宝'}
                    </p>
                  </div>
                  {order.transaction_id && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">交易号</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.transaction_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
