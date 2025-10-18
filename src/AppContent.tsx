import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ChatWidget } from './components/ChatWidget';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useChat } from './hooks/useChat';
import { useAuth } from './contexts/AuthContext';
import { userService } from './services/userService';

export default function AppContent() {
  const { user, refreshUserData } = useAuth();
  const {
    messages,
    isLoading,
    error,
    selectedModel,
    queueInfo,
    sendMessage,
    retryToInput,
    clearChat,
    setSelectedModel,
    stopQueue,
    clearQueue,
  } = useChat();

  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);

  useEffect(() => {
    (window as any).mainChatSendMessage = sendMessage;
    return () => {
      delete (window as any).mainChatSendMessage;
    };
  }, [sendMessage]);

  const handleSendMessage = async (text: string, images: File[]) => {
    if (!user) return;

    if (user.permissions.remaining_draws <= 0) {
      alert('您的绘图次数已用完，请联系管理员');
      return;
    }

    const success = await userService.decrementDraws(user.id);
    if (success) {
      await userService.logAction(user.id, 'draw', { model: selectedModel });
      sendMessage(text, images);
      setEditContent(null);
      await refreshUserData();
    } else {
      alert('无法使用绘图功能，请联系管理员');
    }
  };

  const handleSetEditContent = (text: string, images: File[]) => {
    setEditContent({ text, images });
  };

  const handleClearEditContent = () => {
    setEditContent(null);
  };

  const canUseChat = user?.permissions.chat_assistant_enabled || false;

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex flex-col">
        <ChatHeader
          onClearChat={clearChat}
          messageCount={messages.length}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          isLoading={isLoading}
          queueInfo={queueInfo}
          onStopQueue={stopQueue}
          onClearQueue={clearQueue}
        />

        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          error={error}
          onRetryToInput={retryToInput}
          onSetEditContent={handleSetEditContent}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          editContent={editContent}
          onClearEditContent={handleClearEditContent}
        />

        <ImageModal />
        <ImageGallery />
        <ImageSelector />

        {canUseChat && <ChatWidget />}
      </div>
    </ErrorBoundary>
  );
}
