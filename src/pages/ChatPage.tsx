import React, { useState, useEffect } from 'react';
import { ChatContainer } from '../components/ChatContainer';
import { ChatInput } from '../components/ChatInput';
import { ChatHeader } from '../components/ChatHeader';
import { ImageModal } from '../components/ImageModal';
import { ImageGallery } from '../components/ImageGallery';
import { ChatWidget } from '../components/ChatWidget';
import { ImageSelector } from '../components/ImageSelector';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useChat } from '../hooks/useChat';

export default function ChatPage() {
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
    clearQueue
  } = useChat();

  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);

  useEffect(() => {
    (window as any).mainChatSendMessage = sendMessage;
    return () => {
      delete (window as any).mainChatSendMessage;
    };
  }, [sendMessage]);

  const handleSendMessage = (text: string, images: File[]) => {
    sendMessage(text, images);
    setEditContent(null);
  };

  const handleSetEditContent = (text: string, images: File[]) => {
    setEditContent({ text, images });
  };

  const handleClearEditContent = () => {
    setEditContent(null);
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
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
        <ChatWidget />
      </div>
    </ErrorBoundary>
  );
}
