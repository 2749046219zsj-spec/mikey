import React from 'react';
import { Bot, Trash2, StopCircle, XCircle, Sparkles, Wrench, Image as ImageIcon } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { SeedreamSettings, SeedreamConfig } from './SeedreamSettings';
import { useAuth } from '../contexts/AuthContext';

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
  onShowGallery?: () => void;
  onShowDashboard?: () => void;
  seedreamConfig?: SeedreamConfig;
  onSeedreamConfigChange?: (config: SeedreamConfig) => void;
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
  canUseProfessionalMode,
  onShowGallery,
  onShowDashboard,
  seedreamConfig,
  onSeedreamConfigChange
}) => {
  const { user } = useAuth();
  const isSeedreamModel = selectedModel === 'Seedream-4.0';

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
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* 统一的导航栏 */}
        <div className="flex items-center justify-between mb-3">
          {/* 左侧：Logo 和标题 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">AI 创意助手</h1>
              {queueInfo?.isProcessing && (
                <p className="text-xs text-purple-600 font-medium">
                  批量绘图中: {queueInfo.current}/{queueInfo.total}
                </p>
              )}
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 浏览画廊 */}
            {onShowGallery && (
              <button
                onClick={onShowGallery}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-sm font-medium"
              >
                <ImageIcon size={16} />
                浏览画廊
              </button>
            )}

            {/* 模式切换 */}
            <button
              onClick={() => onModeChange('normal')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                currentMode === 'normal'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Sparkles size={16} />
              普通模式
            </button>

            {canUseProfessionalMode && (
              <button
                onClick={() => onModeChange('professional')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                  currentMode === 'professional'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Wrench size={16} />
                专业模式
              </button>
            )}

            {/* 队列控制按钮 */}
            {queueInfo?.isProcessing && (
              <>
                <button
                  onClick={onStopQueue}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 border border-orange-300"
                  title="停止当前绘制"
                >
                  <StopCircle size={16} />
                  停止
                </button>
                <button
                  onClick={onClearQueue}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-300"
                  title="结束绘制"
                >
                  <XCircle size={16} />
                  结束
                </button>
              </>
            )}

            {/* 清空对话 */}
            {messageCount > 0 && (
              <button
                onClick={onClearChat}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Trash2 size={16} />
                清空
              </button>
            )}

            {/* 剩余次数和账户按钮 */}
            {user && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">剩余绘图次数:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {user.permissions.remaining_draws}
                  </span>
                </div>
                <button
                  onClick={onShowDashboard}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                >
                  我的账户
                </button>
              </>
            )}
          </div>
        </div>

        {/* 模型选择器和 Seedream 设置 */}
        <div className="flex items-center gap-3">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            disabled={isLoading}
          />
          {isSeedreamModel && seedreamConfig && onSeedreamConfigChange && (
            <SeedreamSettings
              config={seedreamConfig}
              onChange={onSeedreamConfigChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};