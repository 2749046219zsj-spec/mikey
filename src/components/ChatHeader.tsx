import React, { useState } from 'react';
import { Bot, Trash2, StopCircle, XCircle, Settings, User, LogOut, ShoppingBag, Coins } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { PaymentPackages } from './payment/PaymentPackages';
import { useAuth } from '../contexts/AuthContext';

interface ChatHeaderProps {
  onClearChat: () => void;
  messageCount: number;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isLoading?: boolean;
  queueInfo?: {
    total: number;
    current: number;
    isProcessing: boolean;
  };
  onStopQueue?: () => void;
  onClearQueue?: () => void;
  onNavigateToAdmin?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  messageCount,
  selectedModel,
  onModelChange,
  isLoading = false,
  queueInfo,
  onStopQueue,
  onClearQueue,
  onNavigateToAdmin
}) => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getModelDisplayName = (modelId: string) => {
    switch (modelId) {
      case 'Gemini-2.5-Flash-Image':
        return 'Gemini 2.5 Flash';
      default:
        return modelId;
    }
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
    refreshProfile();
  };

  return (
    <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">AI Chat</h1>
              <p className="text-sm text-gray-600">Powered by Gemini 2.5 Flash</p>
              {queueInfo?.isProcessing && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-purple-600 font-medium">
                    批量绘图进行中: {queueInfo.current}/{queueInfo.total}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPayment(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all"
            >
              <Coins size={16} />
              {profile?.credits_balance || 0} 次
            </button>

            {queueInfo?.isProcessing && (
              <>
                <button
                  onClick={onStopQueue}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 border border-orange-300"
                  title="停止当前绘制，完成当前图后不再继续"
                >
                  <StopCircle size={16} />
                  停止绘制
                </button>
                <button
                  onClick={onClearQueue}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-300"
                  title="立即结束绘制并清空队列"
                >
                  <XCircle size={16} />
                  结束绘制
                </button>
              </>
            )}
            {messageCount > 0 && (
              <button
                onClick={onClearChat}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Trash2 size={16} />
                Clear Chat
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <User size={16} />
                {profile?.username || profile?.email?.split('@')[0]}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      剩余: {profile?.credits_balance || 0} 次
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowPayment(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    购买套餐
                  </button>

                  {profile?.is_admin && onNavigateToAdmin && (
                    <button
                      onClick={() => {
                        onNavigateToAdmin();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings size={16} />
                      管理后台
                    </button>
                  )}

                  <button
                    onClick={signOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            disabled={isLoading}
          />
        </div>
      </div>

      {showPayment && <PaymentPackages onClose={handlePaymentClose} />}
    </div>
  );
};