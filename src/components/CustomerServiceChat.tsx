import React, { useRef, useEffect } from 'react';
import { Bot, User, Loader2 } from 'lucide-react';

interface ServiceMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  images?: string[];
  hasError?: boolean;
}

interface CustomerServiceChatProps {
  messages: ServiceMessage[];
  isLoading: boolean;
}

export const CustomerServiceChat: React.FC<CustomerServiceChatProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            客服助手
          </h2>
          <p className="text-gray-600 leading-relaxed">
            你好！我是客服助手，有什么可以帮助你的吗？
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 mb-6 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.type === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                : 'bg-gradient-to-r from-orange-500 to-red-600'
            }`}>
              {message.type === 'user' ? (
                <User size={16} className="text-white" />
              ) : (
                <Bot size={16} className="text-white" />
              )}
            </div>

            <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
              {message.images && message.images.length > 0 && (
                <div className={`mb-3 flex flex-wrap gap-2 ${message.type === 'user' ? 'justify-end' : ''}`}>
                  {message.images.map((imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Uploaded ${index + 1}`}
                      className="max-w-xs rounded-lg border border-gray-200 shadow-sm"
                    />
                  ))}
                </div>
              )}

              <div className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : message.hasError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-white border border-gray-200'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mb-6">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-orange-500" />
                <span className="text-sm text-gray-600">客服正在回复...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
