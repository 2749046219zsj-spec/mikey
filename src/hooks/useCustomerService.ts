import { useState, useCallback } from 'react';
import { GeminiApiService } from '../services/geminiApi';

interface ServiceMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  images?: string[];
  hasError?: boolean;
}

export const useCustomerService = () => {
  const [messages, setMessages] = useState<ServiceMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const geminiService = new GeminiApiService();

  const sendMessage = useCallback(async (text: string, images: File[] = []) => {
    if (!text.trim() && images.length === 0) return;

    const imageUrls = images.map(file => URL.createObjectURL(file));

    const userMessage: ServiceMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      images: imageUrls,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await geminiService.sendMessage(text, images, 'Gemini-2.5-Flash', conversationHistory);

      const aiMessage: ServiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ServiceMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `抱歉，出现了错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
        hasError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, geminiService]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat
  };
};
