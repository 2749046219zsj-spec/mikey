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
  const [keepWidgetOpen, setKeepWidgetOpen] = useState(false);
  const { addImageToUnified } = useImageSelector();

  const [assistantMode, setAssistantMode] = useState<'normal' | 'assistant'>('normal');
  const [styleCount, setStyleCount] = useState(3);
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<any[]>([]);
  const [assistantMessages, setAssistantMessages] = useState<any[]>([]);

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
      setKeepWidgetOpen(true);
    };
    return () => {
      delete (window as any).mainChatSendMessage;
      delete (window as any).openReferenceLibrary;
    };
  }, [sendMessage]);

  const handleSendMessage = async (text: string, images: File[]) => {
    if (!user) return;

    if (assistantMode === 'assistant') {
      // 客服助手模式：不消耗次数，直接添加消息
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        images: images.map(img => URL.createObjectURL(img)),
        timestamp: new Date()
      };
      setAssistantMessages(prev => [...prev, userMessage]);
      // TODO: 这里可以添加AI响应逻辑
    } else {
      // 普通模式：消耗次数
      const canProceed = await checkAndDecrementDraws();
      if (canProceed) {
        sendMessage(text, images, false);
        setEditContent(null);
      }
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

    if (assistantMode === 'assistant') {
      setSelectedReferenceImages(prev => [...prev, ...imageUrls]);
    } else if ((window as any).widgetHandleReferenceSelection) {
      (window as any).widgetHandleReferenceSelection(imageUrls);
    }

    setShowReferenceLibrary(false);
  };

  const handleProductSelect = (product: string) => {
    console.log('Selected product:', product);
  };

  const handleStyleSelect = (style: string) => {
    console.log('Selected style:', style);
  };

  const handleCraftsConfirm = (crafts: string[]) => {
    console.log('Selected crafts:', crafts);
  };

  const handleStructureSelect = (structure: string) => {
    console.log('Selected structure:', structure);
  };

  const handleClearAssistantChat = () => {
    setAssistantMessages([]);
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-slate-50 flex flex-col">
        <ChatHeader
          onClearChat={assistantMode === 'assistant' ? handleClearAssistantChat : clearChat}
          messageCount={assistantMode === 'assistant' ? assistantMessages.length : messages.length}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          isLoading={isLoading}
          queueInfo={queueInfo}
          onStopQueue={stopQueue}
          onClearQueue={clearQueue}
          assistantMode={assistantMode}
          onModeChange={setAssistantMode}
        />

        <ChatContainer
          messages={assistantMode === 'assistant' ? assistantMessages : messages}
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
          assistantMode={assistantMode}
          assistantPanelProps={assistantMode === 'assistant' ? {
            onProductSelect: handleProductSelect,
            onStyleSelect: handleStyleSelect,
            onCraftsConfirm: handleCraftsConfirm,
            onStructureSelect: handleStructureSelect,
            styleCount,
            onStyleCountChange: setStyleCount,
            selectedReferenceImages,
            onOpenReferenceLibrary: () => setShowReferenceLibrary(true),
            onClearChat: handleClearAssistantChat,
            hasMessages: assistantMessages.length > 0
          } : undefined}
        />

        <ImageModal />
        <ImageGallery />
        <ImageSelector />
        <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

        {canUseChat && <ChatWidget key="widget" keepOpen={keepWidgetOpen} />}

        {showReferenceLibrary && (
          <ReferenceImageLibrary
            onBack={() => setShowReferenceLibrary(false)}
            onSelectImages={handleReferenceLibrarySelect}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
