import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { AssistantMessageActions } from './AssistantMessageActions';
import { Message } from '../types/chat';
import { Loader2, Bot } from 'lucide-react';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onRetryToInput?: (messageId: string, onEdit: (text: string, images: File[]) => void) => void;
  onSetEditContent?: (text: string, images: File[]) => void;
  isProfessionalMode?: boolean;
  onSendPromptsToGenerate?: (messageId: string, prompts: string[]) => void;
  sentMessageIds?: Set<string>;
}

export const ChatContainer: React.FC<ChatContainerProps> = React.memo(({
  messages,
  isLoading,
  error,
  onRetryToInput,
  onSetEditContent,
  isProfessionalMode = false,
  onSendPromptsToGenerate,
  sentMessageIds = new Set()
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
            欢迎您来到uralili设计网站
          </h2>
          <p className="text-gray-600 leading-relaxed">
            在这里你可以发挥无限的创作能力只需要告诉我你的产品
        风格，元素,工艺，无需任何操作一键生成效果，解放新生产力，
                 --（承接定制需求wx：S2514088671）--
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message, index) => {
          const previousUserMessage = message.type === 'ai' && index > 0 && messages[index - 1].type === 'user'
            ? messages[index - 1]
            : null;

          return (
          <div key={message.id}>
            <ChatMessage
              message={message}
              onRetryToInput={onRetryToInput}
              onSetEditContent={onSetEditContent}
              userPrompt={previousUserMessage?.content}
            />
            {isProfessionalMode && message.type === 'ai' && !message.hasError && onSendPromptsToGenerate && (
              <div className="max-w-[80%] ml-11">
                <AssistantMessageActions
                  messageContent={message.content}
                  messageId={message.id}
                  onSendToGenerate={(prompts) => onSendPromptsToGenerate(message.id, prompts)}
                  alreadySent={sentMessageIds.has(message.id)}
                />
              </div>
            )}
          </div>
        );
        })}
        
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