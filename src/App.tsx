import React, { useState } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CustomerServiceChat } from './components/CustomerServiceChat';
import { useChat } from './hooks/useChat';
import { useCustomerService } from './hooks/useCustomerService';
import { AppMode } from './components/ModeSelector';

function App() {
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

  const {
    messages: serviceMessages,
    isLoading: serviceLoading,
    sendMessage: sendServiceMessage,
    clearChat: clearServiceChat
  } = useCustomerService();

  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);
  const [currentMode, setCurrentMode] = useState<AppMode>('image-generation');

  const handleSendMessage = (text: string, images: File[]) => {
    if (currentMode === 'image-generation') {
      sendMessage(text, images);
    } else {
      sendServiceMessage(text, images);
    }
    setEditContent(null);
  };

  const handleClearChat = () => {
    if (currentMode === 'image-generation') {
      clearChat();
    } else {
      clearServiceChat();
    }
  };

  const handleSetEditContent = (text: string, images: File[]) => {
    setEditContent({ text, images });
  };

  const handleClearEditContent = () => {
    setEditContent(null);
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col">
        {currentMode === 'image-generation' ? (
          <>
            <ChatHeader
              onClearChat={handleClearChat}
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
          </>
        ) : (
          <>
            <ChatHeader
              onClearChat={handleClearChat}
              messageCount={serviceMessages.length}
              selectedModel="Gemini-2.5-Flash"
              onModelChange={() => {}}
              isLoading={serviceLoading}
              queueInfo={{ total: 0, current: 0, isProcessing: false }}
              onStopQueue={() => {}}
              onClearQueue={() => {}}
            />

            <CustomerServiceChat messages={serviceMessages} isLoading={serviceLoading} />
          </>
        )}

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={currentMode === 'image-generation' ? isLoading : serviceLoading}
          editContent={editContent}
          onClearEditContent={handleClearEditContent}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />

        <ImageModal />
        <ImageGallery />
        <ImageSelector />
      </div>
    </ErrorBoundary>
  );
}

export default App;