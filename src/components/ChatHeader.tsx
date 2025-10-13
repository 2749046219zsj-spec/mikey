import React from 'react';
import { Bot, Trash2 } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface ChatHeaderProps {
  onClearChat: () => void;
  messageCount: number;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isLoading?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onClearChat, 
  messageCount, 
  selectedModel, 
  onModelChange, 
  isLoading = false 
}) => {
  const getModelDisplayName = (modelId: string) => {
    switch (modelId) {
      case 'Gemini-2.5-Flash-Image':
        return 'Gemini 2.5 Flash';
      case 'GPT-4.1':
        return 'GPT-4.1';
      default:
        return modelId;
    }
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
              <p className="text-sm text-gray-600">Powered by {getModelDisplayName(selectedModel)}</p>
            </div>
          </div>
          
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