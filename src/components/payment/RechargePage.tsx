import React, { useState, useEffect } from 'react';
import { Zap, Check, Loader, AlertCircle } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import type { RechargePackage } from '../../types/payment';

export const RechargePage: React.FC = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getRechargePackages();
      setPackages(data);
    } catch (err) {
      console.error('Failed to load packages:', err);
      setError('加载套餐失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: RechargePackage) => {
    setSelectedPackage(pkg);
    setError(null);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;

    try {
      setCreating(true);
      setError(null);

      const result = await paymentService.createWechatOrder({
        package_id: selectedPackage.id,
        payment_method: 'wechat',
      });

      console.log('Order created:', result);
      alert(`订单创建成功！\n订单号：${result.orderNo}\n\n在真实环境中，这里会唤起微信支付。`);

      setSelectedPackage(null);
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setError(err.message || '创建订单失败');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-xl">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-600 mb-6">登录后即可购买充值套餐</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            选择充值套餐
          </h1>
          <p className="text-lg text-gray-600">
            购买绘图次数，解锁无限创作可能
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">加载套餐中...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {packages.map((pkg) => {
              const totalDraws = pkg.draw_count + pkg.bonus_draws;
              const isSelected = selectedPackage?.id === pkg.id;
              const pricePerDraw = (pkg.price / totalDraws).toFixed(2);

              return (
                <div
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg)}
                  className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'ring-4 ring-blue-500 shadow-2xl transform scale-105'
                      : 'hover:shadow-xl hover:transform hover:scale-102 shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{pkg.name}</h3>
                    {isSelected && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 mb-6 min-h-[48px]">{pkg.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-bold text-blue-600">¥{pkg.price}</span>
                    </div>
                    <p className="text-sm text-gray-500">单次 ¥{pricePerDraw}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-700">
                        基础次数：<span className="font-semibold">{pkg.draw_count}次</span>
                      </span>
                    </div>
                    {pkg.bonus_draws > 0 && (
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-green-500" />
                        <span className="text-green-600">
                          额外赠送：<span className="font-semibold">+{pkg.bonus_draws}次</span>
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-lg font-bold text-gray-900">
                        共 {totalDraws} 次绘图机会
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPackage(pkg);
                    }}
                    disabled={creating}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? '已选择' : '选择套餐'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selectedPackage && (
          <div className="max-w-md mx-auto bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              确认订单
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">套餐名称</span>
                <span className="font-semibold text-gray-900">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">绘图次数</span>
                <span className="font-semibold text-gray-900">
                  {selectedPackage.draw_count + selectedPackage.bonus_draws}次
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">支付方式</span>
                <span className="font-semibold text-gray-900">微信支付</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold text-gray-900">应付金额</span>
                <span className="text-3xl font-bold text-blue-600">
                  ¥{selectedPackage.price}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePurchase}
                disabled={creating}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {creating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>创建订单中...</span>
                  </>
                ) : (
                  <span>微信支付</span>
                )}
              </button>

              <button
                onClick={() => setSelectedPackage(null)}
                disabled={creating}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-all duration-300"
              >
                取消
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              支付即表示您同意我们的服务条款
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
