import { X } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">绘图次数已用完</h2>
          <p className="text-gray-600 mb-6">扫描下方二维码添加客服微信，获取更多绘图次数</p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <img
              src="/e9f4ef532b45af5f515f2acf9d19616e.jpg"
              alt="客服微信二维码"
              className="w-full max-w-xs mx-auto rounded-lg shadow-md"
            />
          </div>

          <div className="text-sm text-gray-500 mb-6">
            <p className="mb-2">扫一扫上面的二维码图案，加我为朋友。</p>
            <p className="font-medium text-gray-700">熊孩纸、阿联酋 迪拜</p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
