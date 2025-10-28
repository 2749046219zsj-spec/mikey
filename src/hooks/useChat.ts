import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState } from '../types/chat';
import { GeminiApiService } from '../services/geminiApi';
import { SeedreamApiService } from '../services/seedreamApi';
import { usePromptQueue } from './usePromptQueue';
import { SeedreamConfig } from '../components/SeedreamSettings';

type BeforeSendCallback = () => Promise<boolean>;

export const useChat = (beforeSendCallback?: BeforeSendCallback, seedreamConfig?: SeedreamConfig) => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'Gemini-2.5-Flash-Image'
  });
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  const geminiService = new GeminiApiService();
  const seedreamService = new SeedreamApiService();
  const { queue, referenceImages, isProcessing, isStopped, currentIndex, totalCount, addPrompts, processNext, stopQueue, clearQueue, setProcessing } = usePromptQueue();

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
  const sendSinglePrompt = useCallback(async (text: string, images: File[] = [], skipCallback = false) => {
    if (!text.trim() && images.length === 0) return;

    // 如果提供了回调函数且不跳过，先执行回调检查权限
    if (!skipCallback && beforeSendCallback) {
      const canProceed = await beforeSendCallback();
      if (!canProceed) {
        return false;
      }
    }

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
      let response: string;

      if (state.selectedModel === 'Seedream-4.0') {
        // Calculate actual size based on aspect ratio if not using custom size
        let actualSize: string;

        if (seedreamConfig?.useCustomSize) {
          actualSize = `${seedreamConfig.customWidth}x${seedreamConfig.customHeight}`;
        } else {
          // Map aspect ratios to actual pixel dimensions based on resolution
          const aspectRatioSizes: Record<string, { width: number; height: number }> = {
            '1:1': { width: 2048, height: 2048 },
            '3:4': { width: 1728, height: 2304 },
            '4:3': { width: 2304, height: 1728 },
            '16:9': { width: 2560, height: 1440 },
            '9:16': { width: 1440, height: 2560 },
            '2:3': { width: 1728, height: 2592 },
            '3:2': { width: 2592, height: 1728 },
            '21:9': { width: 2560, height: 1097 }
          };

          const ratio = seedreamConfig?.aspectRatio || '1:1';
          const dimensions = aspectRatioSizes[ratio] || { width: 2048, height: 2048 };
          actualSize = `${dimensions.width}x${dimensions.height}`;
        }

        const seedreamParams = {
          size: seedreamConfig?.resolution,
          customSize: actualSize,
          maxImages: seedreamConfig?.sequentialMode !== 'off' ? seedreamConfig.imageCount : 1,
          sequentialMode: seedreamConfig?.sequentialMode !== 'off' ? seedreamConfig.sequentialMode : undefined
        };

        response = await seedreamService.sendMessage(text, images, [], seedreamParams);
      } else {
        const conversationHistory: any[] = [];
        response = await geminiService.sendMessage(text, images, state.selectedModel, conversationHistory, 'normal');
      }

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

  const sendMessage = useCallback(async (text: string, images: File[] = [], enableBatchMode = false) => {
    if (!text.trim() && images.length === 0) return;

    setRetryCallback(null);

    // 只有明确启用批量模式时才解析提示词
    if (enableBatchMode) {
      const prompts = parsePrompts(text);

      // 如果找到多个提示词，使用队列模式
      if (prompts.length > 0) {
        addPrompts(prompts, images);
        setProcessing(true);
        // 发送第一个提示词，跳过回调因为外部已经检查过了
        await sendSinglePrompt(prompts[0], images, true);
        setProcessing(false);
      } else {
        // 没有找到提示词，直接发送整个消息
        await sendSinglePrompt(text, images, true);
      }
    } else {
      // 不启用批量模式，直接发送整个消息
      await sendSinglePrompt(text, images, true);
    }
  }, [parsePrompts, addPrompts, sendSinglePrompt, setProcessing]);

  // 监听队列变化，自动处理下一个提示词
  useEffect(() => {
    if (queue.length > 0 && !isProcessing && !isStopped && currentIndex < queue.length - 1) {
      // 延迟2秒后发送下一个提示词
      const timer = setTimeout(async () => {
        setProcessing(true);
        const nextPrompt = queue[currentIndex + 1];
        const success = await sendSinglePrompt(nextPrompt, referenceImages);
        if (success) {
          processNext();
        }
        setProcessing(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [queue, referenceImages, isProcessing, isStopped, currentIndex, sendSinglePrompt, processNext, setProcessing]);

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
    setSelectedModel,
    stopQueue,
    clearQueue
  };
};