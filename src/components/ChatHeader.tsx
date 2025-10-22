import React from 'react';
import { Bot, Trash2, StopCircle, XCircle, Sparkles, Wrench } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

export type AppMode = 'normal' | 'professional';

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
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  canUseProfessionalMode: boolean;
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
  currentMode,
  onModeChange,
  canUseProfessionalMode
}) => {
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
        {/* 模式切换标签 */}
        {canUseProfessionalMode && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => onModeChange('normal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentMode === 'normal'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles size={18} />
              普通模式
            </button>
            <button
              onClick={() => onModeChange('professional')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentMode === 'professional'
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Wrench size={18} />
              专业模式
            </button>
          </div>
        )}

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