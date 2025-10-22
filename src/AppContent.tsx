import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ChatWidget } from './components/ChatWidget';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContactModal } from './components/ContactModal';
import ReferenceImageLibrary from './components/ReferenceImageLibrary';
import { useChat } from './hooks/useChat';
import { useAuth } from './contexts/AuthContext';
import { userService } from './services/userService';
import { useImageSelector } from './hooks/useImageSelector';

export default function AppContent() {
  const { user, refreshUserData } = useAuth();
  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  const { addImageToUnified } = useImageSelector();

  const checkAndDecrementDraws = React.useCallback(async () => {
    if (!user) return false;

    if (user.permissions.remaining_draws <= 0) {
      setShowContactModal(true);
      return false;
    }

    const success = await userService.decrementDraws(user.id);
    if (success) {
      await userService.logAction(user.id, 'draw', { model: 'current' });
      await refreshUserData();
      return true;
    } else {
      alert('无法使用绘图功能，请联系管理员');
      return false;
    }
  }, [user, refreshUserData]);

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
  } = useChat(checkAndDecrementDraws);

  useEffect(() => {
    // 暴露给客服助手的接口，支持批量模式
    (window as any).mainChatSendMessage = (text: string, images: File[], enableBatchMode = false) => {
      sendMessage(text, images, enableBatchMode);
    };
    // 暴露打开参考图库的接口
    (window as any).openReferenceLibrary = () => {
      setShowReferenceLibrary(true);
    };
    return () => {
      delete (window as any).mainChatSendMessage;
      delete (window as any).openReferenceLibrary;
    };
  }, [sendMessage]);

  const handleSendMessage = async (text: string, images: File[]) => {
    if (!user) return;

    const canProceed = await checkAndDecrementDraws();
    if (canProceed) {
      // 主界面发送，不启用批量模式
      sendMessage(text, images, false);
      setEditContent(null);
    }
  };

  const handleSetEditContent = (text: string, images: File[]) => {
    setEditContent({ text, images });
  };

  const handleClearEditContent = () => {
    setEditContent(null);
  };

  const canUseChat = user?.permissions.chat_assistant_enabled || false;

  const handleReferenceLibrarySelect = async (imageUrls: string[]) => {
    console.log('Selected images from library:', imageUrls);

    for (const url of imageUrls) {
      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const blob = await response.blob();
        const fileName = url.split('/').pop()?.split('?')[0] || 'reference-image.jpg';
        const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        addImageToUnified(file);
      } catch (error) {
        console.error('Failed to convert URL to File:', url, error);
        alert(`无法加载图片: ${url}`);
      }
    }

    if ((window as any).widgetHandleReferenceSelection) {
      (window as any).widgetHandleReferenceSelection(imageUrls);
    }
  };

  if (showReferenceLibrary) {
    return (
      <ErrorBoundary>
        <ReferenceImageLibrary
          onBack={() => setShowReferenceLibrary(false)}
          onSelectImages={handleReferenceLibrarySelect}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-slate-50 flex flex-col">
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
        <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

        {canUseChat && <ChatWidget />}
      </div>
    </ErrorBoundary>
  );
}
