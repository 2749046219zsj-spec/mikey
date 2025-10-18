import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Package {
  id: string;
  name: string;
  price: number;
  credits: number;
  tier: string;
}

interface PaymentPackagesProps {
  onClose: () => void;
}

export function PaymentPackages({ onClose }: PaymentPackagesProps) {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('加载套餐失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowQRCode(true);

    try {
      await supabase.from('transactions').insert({
        user_id: profile?.id,
        package_id: pkg.id,
        amount: pkg.price,
        credits_awarded: pkg.credits,
        payment_status: 'pending',
        payment_method: 'wechat',
      });
    } catch (error) {
      console.error('创建交易失败:', error);
    }
  };

  const getQRCodeImage = (price: number) => {
    if (price === 39) return '/public/image copy copy.png';
    if (price === 79) return '/public/image copy copy copy.png';
    if (price === 99) return '/public/image copy.png';
    return '/public/image.png';
  };

  if (showQRCode && selectedPackage) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
          <button
            onClick={() => {
              setShowQRCode(false);
              setSelectedPackage(null);
            }}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedPackage.name}
            </h3>
            <p className="text-3xl font-bold text-blue-600 mb-6">
              ¥{selectedPackage.price}
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <img
                src={getQRCodeImage(selectedPackage.price)}
                alt="微信支付二维码"
                className="w-64 h-64 mx-auto"
              />
            </div>

            <div className="space-y-3 text-left bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">1.</span>
                使用微信扫描上方二维码完成支付
              </p>
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">2.</span>
                支付完成后，请联系管理员添加次数
              </p>
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">3.</span>
                管理员确认后，{selectedPackage.credits}次使用权限将自动到账
              </p>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              如遇到问题，请联系客服处理
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">购买套餐</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white rounded-xl border-2 p-6 transition-all hover:shadow-xl ${
                    index === 1
                      ? 'border-blue-500 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-medium">
                      最受欢迎
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {pkg.name}
                    </h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      ¥{pkg.price}
                    </div>
                    <div className="text-gray-600">
                      {pkg.credits} 张图片
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>每张 ¥{(pkg.price / pkg.credits).toFixed(2)}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>永久有效</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>高清输出</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>无水印</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => handlePurchase(pkg)}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${
                      index === 1
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    立即购买
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">购买须知</h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• 支付完成后需要管理员手动添加次数</li>
              <li>• 请保存支付凭证以便核实</li>
              <li>• 如有疑问请联系客服</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
