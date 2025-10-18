import React from 'react';
import { Bot, Trash2, StopCircle, XCircle, ArrowLeft, LogOut, User } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  messageCount,
  selectedModel,
  onModelChange,
  isLoading = false,
  queueInfo,
  onStopQueue,
  onClearQueue
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getModelDisplayName = (modelId: string) => {
    switch (modelId) {
      case 'Gemini-2.5-Flash-Image':
        return 'Gemini 2.5 Flash';
      default:
        return modelId;
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
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
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
              <User size={16} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut size={16} />
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
    </div>
  );
};