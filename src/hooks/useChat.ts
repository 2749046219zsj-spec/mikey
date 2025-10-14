import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { GeminiApiService } from '../services/geminiApi';
import { usePromptQueue } from './usePromptQueue';

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'Gemini-2.5-Flash-Image'
  });
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  const geminiService = new GeminiApiService();
  const { queue, isProcessing, currentIndex, totalCount, processNext, setProcessing } = usePromptQueue();

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    return newMessage.id;
  }, []);

  // 自动处理队列中的下一个提示词
  const processQueueNext = useCallback(() => {
    if (queue.length > 0 && !isProcessing) {
      const hasNext = processNext();
      if (hasNext && queue[currentIndex + 1]) {
        // 延迟1秒后发送下一个提示词，给用户时间查看
        setTimeout(() => {
          sendMessage(queue[currentIndex + 1], []);
        }, 1000);
      }
    }
  }, [queue, currentIndex, isProcessing, processNext]);

  const sendMessage = useCallback(async (text: string, images: File[] = []) => {
    if (!text.trim() && images.length === 0) return;

    // Convert files to URLs for display
    const imageUrls = images.map(file => URL.createObjectURL(file));

    // Add user message
    const userMessageId = addMessage({
      type: 'user',
      content: text,
      images: imageUrls,
      originalText: text,
      originalImages: images,
      model: state.selectedModel
    });

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    setRetryCallback(null);
    setProcessing(true);

    try {
      // Build conversation history for API
      const conversationHistory = state.messages.map(msg => {
        if (msg.type === 'user') {
          // For user messages, create content array
          const content = [];
          if (msg.originalText && msg.originalText.trim()) {
            content.push({
              type: "text",
              text: msg.originalText
            });
          }
          // Note: We don't include images in history to avoid token limits
          return {
            role: "user",
            content: content.length > 0 ? content : [{ type: "text", text: msg.content }]
          };
        } else {
          // For AI messages, extract clean text
          const cleanContent = msg.content.replace(/(https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi, '').replace(/!\[generated_image_\d+\]/g, '').replace(/\(\s*\)/g, '').replace(/\n\s*\n/g, '\n').trim();
          return {
            role: "assistant",
            content: cleanContent || msg.content
          };
        }
      });

      // Send to Gemini API
      const response = await geminiService.sendMessage(text, images, state.selectedModel, conversationHistory);

      // Add AI response
      addMessage({
        type: 'ai',
        content: response,
        model: state.selectedModel
      });
      
      // 如果有队列任务，处理下一个
      if (queue.length > 0) {
        setTimeout(() => {
          processQueueNext();
        }, 2000); // 等待2秒让用户看到结果
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      // Add error message with retry functionality
      addMessage({
        type: 'ai',
        content: `生成失败: ${errorMessage}`,
        hasError: true,
        originalText: text,
        originalImages: images,
        model: state.selectedModel
      });
      
      setState(prev => ({
        ...prev,
        error: null
      }));
      setProcessing(false);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, geminiService, state.selectedModel, queue, processQueueNext, setProcessing]);

  const retryToInput = useCallback((messageId: string, onEdit: (text: string, images: File[]) => void) => {
    const message = state.messages.find(m => m.id === messageId);
    if (message && message.originalText !== undefined && message.originalImages !== undefined) {
      onEdit(message.originalText, message.originalImages || []);
    }
  }, [state.messages]);

  const setSelectedModel = useCallback((model: string) => {
    setState(prev => ({ ...prev, selectedModel: model }));
  }, []);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      selectedModel: state.selectedModel
    });
    setRetryCallback(null);
  }, [state.selectedModel]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    selectedModel: state.selectedModel,
    queueInfo: {
      total: totalCount,
      current: currentIndex + 1,
      isProcessing: queue.length > 0
    },
    sendMessage,
    retryToInput,
    clearChat,
    setSelectedModel
  };
};