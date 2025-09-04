import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { Message } from '../types/chat';
import { Loader2, Bot } from 'lucide-react';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onRetryToInput?: (messageId: string, onEdit: (text: string, images: File[]) => void) => void;
  onSetEditContent?: (text: string, images: File[]) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isLoading, 
  error,
  onRetryToInput,
  onSetEditContent
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            欢迎使用 DeepSeek AI
          </h2>
          <p className="text-gray-600 leading-relaxed">
            开始与 DeepSeek AI 对话。你可以发送文本消息，
            上传图片进行分析，或询问任何问题。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message}
            onRetryToInput={onRetryToInput}
            onSetEditContent={onSetEditContent}
          />
        ))}
        
        {isLoading && (
          <div className="flex gap-3 mb-6">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-purple-500" />
                <span className="text-sm text-gray-600">AI 正在思考中...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};