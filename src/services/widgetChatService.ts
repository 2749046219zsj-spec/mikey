import { supabase } from '../lib/supabase';
import { Message } from '../types/chat';

export const widgetChatService = {
  async saveMessage(userId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase
      .from('widget_chat_messages')
      .insert({
        user_id: userId,
        type: message.type,
        content: message.content,
        images: message.images || [],
        model: message.model || 'Gemini-2.5-Flash-Image',
        has_error: message.hasError || false
      });

    if (error) {
      console.error('Failed to save widget message:', error);
      throw error;
    }
  },

  async loadMessages(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('widget_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load widget messages:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      type: row.type,
      content: row.content,
      images: row.images,
      model: row.model,
      hasError: row.has_error,
      timestamp: new Date(row.created_at)
    }));
  },

  async clearMessages(userId: string): Promise<void> {
    const { error } = await supabase
      .from('widget_chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to clear widget messages:', error);
      throw error;
    }
  }
};
