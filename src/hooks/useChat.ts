import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { GeminiApiService } from '../services/geminiApi';

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    selectedModel: 'GPT-4.1'
  });
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

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
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, geminiService, state.selectedModel]);

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
    sendMessage,
    retryToInput,
    clearChat,
    setSelectedModel
  };
};