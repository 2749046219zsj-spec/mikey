import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ChatWidget } from './components/ChatWidget';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import AuthModal from './components/AuthModal';
import MemberCenter from './components/MemberCenter';
import RechargeModal from './components/RechargeModal';
import AdminPanel from './components/AdminPanel';
import CheckInButton from './components/CheckInButton';
import { useChat } from './hooks/useChat';
import { useAuthStore } from './stores/authStore';

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

  const { user, profile, loading } = useAuthStore();
  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'member' | 'admin'>('chat');

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex flex-col">
        <div className="bg-white border-b shadow-sm px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">AI 创作平台</h1>
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView('chat')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                AI 对话
              </button>
              {user && (
                <>
                  <button
                    onClick={() => setCurrentView('member')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'member'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    会员中心
                  </button>
                  {profile?.is_admin && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentView === 'admin'
                          ? 'bg-red-600 text-white'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      管理后台
                    </button>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <CheckInButton />
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="text-right">
                    <div className="text-xs text-gray-600">积分余额</div>
                    <div className="text-lg font-bold text-blue-600">
                      {profile?.credits_balance || 0}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRechargeModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    充值
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>

        {currentView === 'chat' && (
          <>
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
          </>
        )}

        {currentView === 'member' && <MemberCenter />}
        {currentView === 'admin' && <AdminPanel />}

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <RechargeModal isOpen={showRechargeModal} onClose={() => setShowRechargeModal(false)} />
      </div>
    </ErrorBoundary>
  );
}

export default App;