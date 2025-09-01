import { useState, useCallback } from 'react';
import { Message, ChatState } from '../types/chat';
import { GeminiApiService } from '../services/geminiApi';

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null
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

    // Convert files to URLs for display
    const imageUrls = images.map(file => URL.createObjectURL(file));

    // Add user message
    addMessage({
      type: 'user',
      content: text,
      images: imageUrls
    });

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Send to Gemini API
      const response = await geminiService.sendMessage(text, images);

      // Add AI response
      addMessage({
        type: 'ai',
        content: response
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, geminiService]);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null
    });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    clearChat
  };
};