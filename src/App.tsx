import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ChatWidget } from './components/ChatWidget';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { PaymentTestPanel } from './components/PaymentTestPanel';
import { useChat } from './hooks/useChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { User, LogIn } from 'lucide-react';

function AppContent() {
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

  const { user, credits } = useAuth();
  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // 将发送消息函数暴露给全局，供客服弹窗调用
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
      {showDashboard ? (
        <UserDashboard />
      ) : (
        <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
            {user ? (
              <>
                <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
                  <span className="text-sm text-gray-600">剩余额度:</span>
                  <span className="text-lg font-bold text-blue-600">{credits}</span>
                </div>
                <button
                  onClick={() => setShowDashboard(true)}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-colors"
                >
                  <User size={18} />
                  <span>我的账户</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-all"
              >
                <LogIn size={18} />
                <span>登录/注册</span>
              </button>
            )}
          </div>

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

          {/* 客服弹窗 */}
          <ChatWidget />

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />

          {user && <PaymentTestPanel />}
        </div>
      )}

      {showDashboard && (
        <button
          onClick={() => setShowDashboard(false)}
          className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md transition-colors"
        >
          ← 返回生成页
        </button>
      )}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;