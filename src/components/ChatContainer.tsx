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
  assistantMode?: boolean;
  onConfirmSendPrompts?: (messageId: string) => void;
  extractPrompts?: (content: string) => string[];
}

export const ChatContainer: React.FC<ChatContainerProps> = React.memo(({
  messages,
  isLoading,
  error,
  onRetryToInput,
  onSetEditContent,
  assistantMode = false,
  onConfirmSendPrompts,
  extractPrompts
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
            Welcome to Gemini AI
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Start a conversation with Gemini 2.5 Flash. You can send text messages, 
            upload images for analysis, or ask questions about anything.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <div key={message.id}>
            <ChatMessage
              message={message}
              onRetryToInput={onRetryToInput}
              onSetEditContent={onSetEditContent}
            />

            {assistantMode && message.type === 'ai' && !(message as any).promptsSent && !isLoading && extractPrompts && onConfirmSendPrompts && (() => {
              const prompts = extractPrompts(message.content);
              return prompts.length > 0 ? (
                <div className="ml-11 mb-4">
                  <button
                    onClick={() => onConfirmSendPrompts(message.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    发现 {prompts.length} 个提示词，点击选择参考图
                  </button>
                </div>
              ) : null;
            })()}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mb-6">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-purple-500" />
                <span className="text-sm text-gray-600">Gemini is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});