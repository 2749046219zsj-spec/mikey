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
      // Build conversation history for professional mode
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

      // Send to Gemini API with 'professional' mode for system prompt
      // Professional mode analyzes user needs and reference images to design prompts
      const response = await geminiService.sendMessage(text, images, state.selectedModel, conversationHistory, 'professional');

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

  const retryToInput = useCallback((messageId: string, onEdit: (text: string, images: File[]) => void) => {
    const message = state.messages.find(m => m.id === messageId);
    if (message && message.originalText !== undefined && message.originalImages !== undefined) {
      onEdit(message.originalText, message.originalImages || []);
    }
  }, [state.messages]);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearChat,
    retryToInput
  };
};
