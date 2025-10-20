import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { GeminiApiService } from '../services/geminiApi';

export const useWidgetChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'Gemini-2.5-Flash-Image'
  });

  const geminiService = new GeminiApiService();

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

  const sendMessage = useCallback(async (text: string, images: File[] = []) => {
    if (!text.trim() && images.length === 0) return;

    const imageUrls = images.map(file => URL.createObjectURL(file));

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
      const systemPrompt = {
        role: "system",
        content: `你是一个专业的提示词识别和优化专家。你的任务是从给定文本中快速识别并优化提示词。

**任务要求：**
1. 从输入文本中识别潜在的提示词段落
2. 筛选条件：提示词长度必须大于20个字符
3. 对识别出的提示词进行优化改进
4. 上下文分析：考虑前后文的完整性

**输出格式：**
请将识别和优化后的提示词以编号列表形式输出，每个提示词用双引号包裹：

1. "优化后的提示词内容1"
2. "优化后的提示词内容2"
3. "优化后的提示词内容3"

注意：确保每个提示词都用双引号包裹，并且长度大于20个字符。`
      };

      const conversationHistory = [
        systemPrompt,
        ...state.messages.map(msg => {
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
        })
      ];

      const response = await geminiService.sendMessage(text, images, state.selectedModel, conversationHistory);

      addMessage({
        type: 'ai',
        content: response,
        model: state.selectedModel
      });
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
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, geminiService, state.selectedModel, state.messages]);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      selectedModel: state.selectedModel
    });
  }, [state.selectedModel]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearChat
  };
};
