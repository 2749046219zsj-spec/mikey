import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ChatWidget } from './components/ChatWidget';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useChat } from './hooks/useChat';

function MainApp() {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<'app' | 'admin'>('app');

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (profile?.is_admin && view === 'admin') {
    return <AdminDashboard onNavigateToApp={() => setView('app')} />;
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col">
        <ChatHeader
          onClearChat={clearChat}
          messageCount={messages.length}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          isLoading={isLoading}
          queueInfo={queueInfo}
          onStopQueue={stopQueue}
          onClearQueue={clearQueue}
          onNavigateToAdmin={profile?.is_admin ? () => setView('admin') : undefined}
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

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
