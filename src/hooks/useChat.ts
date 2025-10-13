import { useState, useCallback, useEffect } from 'react';
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
  const { queue, isProcessing, currentIndex, totalCount, addPrompts, processNext, setProcessing } = usePromptQueue();

  // 解析提示词：提取 ** ** 内的内容
  const parsePrompts = useCallback((text: string): string[] => {
    const promptRegex = /\*\*([^*]+)\*\*/g;
    const prompts: string[] = [];
    let match;

    while ((match = promptRegex.exec(text)) !== null) {
      const prompt = match[1].trim();
      if (prompt) {
        prompts.push(prompt);
      }
    }

    return prompts;
  }, []);

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

  // 单独处理单个提示词的内部函数
  const sendSinglePrompt = useCallback(async (text: string, images: File[] = []) => {
    if (!text.trim() && images.length === 0) return;

    // Convert files to URLs for display
    const imageUrls = images.map(file => URL.createObjectURL(file));

    // Add user message
    addMessage({
      type: 'user',
      content: text,
      images: imageUrls,
      originalText: text,
      originalImages: images,
      model: state.selectedModel
    });

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Build conversation history for API
      const conversationHistory = state.messages.map(msg => {
        if (msg.type === 'user') {
          const content = [];
          if (msg.originalText && msg.originalText.trim()) {
            content.push({
              type: "text",
              text: msg.originalText
            });
          }
          return {
            role: "user",
            content: content.length > 0 ? content : [{ type: "text", text: msg.content }]
          };
        } else {
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

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';

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

      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, geminiService, state.selectedModel, state.messages]);

  const sendMessage = useCallback(async (text: string, images: File[] = []) => {
    if (!text.trim() && images.length === 0) return;

    setRetryCallback(null);

    // 解析提示词
    const prompts = parsePrompts(text);

    // 如果找到多个提示词，使用队列模式
    if (prompts.length > 0) {
      addPrompts(prompts);
      setProcessing(true);
      // 发送第一个提示词
      await sendSinglePrompt(prompts[0], images);
      setProcessing(false);
    } else {
      // 没有提示词标记，直接发送整个消息
      await sendSinglePrompt(text, images);
    }
  }, [parsePrompts, addPrompts, sendSinglePrompt, setProcessing]);

  // 监听队列变化，自动处理下一个提示词
  useEffect(() => {
    if (queue.length > 0 && !isProcessing && currentIndex < queue.length - 1) {
      // 延迟2秒后发送下一个提示词
      const timer = setTimeout(async () => {
        setProcessing(true);
        const nextPrompt = queue[currentIndex + 1];
        const success = await sendSinglePrompt(nextPrompt, []);
        if (success) {
          processNext();
        }
        setProcessing(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [queue, isProcessing, currentIndex, sendSinglePrompt, processNext, setProcessing]);

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