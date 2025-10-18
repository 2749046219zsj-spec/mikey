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
import { AdminDashboard } from './components/AdminDashboard';
import { PaymentTestPanel } from './components/PaymentTestPanel';
import { useChat } from './hooks/useChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { User, LogIn, AlertCircle, Clock } from 'lucide-react';

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

  const { user, credits, isAdmin, isApproved, approvalStatus } = useAuth();
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

  if (isAdmin) {
    return (
      <ErrorBoundary>
        <AdminDashboard />
      </ErrorBoundary>
    );
  }

  if (user && !isApproved && approvalStatus === 'pending') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={40} className="text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">账户待审批</h2>
            <p className="text-gray-600 mb-6">
              您的账户正在等待管理员审批，审批通过后即可使用免费的 20 次绘图功能。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>注意：</strong>审批通过后，系统将自动为您充值 20 次免费额度
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              刷新页面
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (user && approvalStatus === 'rejected') {
    return (
      <ErrorBoundary>
        <div className="h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">账户已被拒绝</h2>
            <p className="text-gray-600 mb-6">
              抱歉，您的账户申请未通过审核。如有疑问，请联系客服。
            </p>
            <button
              onClick={async () => {
                const { signOut } = useAuth();
                await signOut();
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

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