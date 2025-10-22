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
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);
  const [assistantMessages, setAssistantMessages] = useState<any[]>([]);

  const [assistantInputText, setAssistantInputText] = useState('');
  const [assistantImages, setAssistantImages] = useState<File[]>([]);
  const [displayText, setDisplayText] = useState('');
  const [fullPromptTemplate, setFullPromptTemplate] = useState('');
  const [selectedItems, setSelectedItems] = useState<{product?: string, styles: string[], crafts: string[]}>({
    styles: [],
    crafts: []
  });

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
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        images: images.map(img => URL.createObjectURL(img)),
        timestamp: new Date()
      };
      setAssistantMessages(prev => [...prev, userMessage]);

      setAssistantInputText('');
      setDisplayText('');
      setAssistantImages([]);
      setFullPromptTemplate('');
      setSelectedItems({ styles: [], crafts: [] });
      setStyleCount(3);
    } else {
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

      const files: File[] = [];
      for (const imageUrl of imageUrls) {
        try {
          const response = await fetch(imageUrl, {
            mode: 'cors',
            credentials: 'omit'
          });
          if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

          const blob = await response.blob();
          const fileName = imageUrl.split('/').pop()?.split('?')[0] || 'reference_image.jpg';
          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
          files.push(file);
        } catch (error) {
          console.error('Failed to convert image URL to file:', imageUrl, error);
        }
      }
      setAssistantImages(prev => [...prev, ...files]);
    } else if ((window as any).widgetHandleReferenceSelection) {
      (window as any).widgetHandleReferenceSelection(imageUrls);
    }

    setShowReferenceLibrary(false);
  };

  const updateTexts = (newSelectedItems: typeof selectedItems) => {
    const displayParts: string[] = [];
    if (newSelectedItems.product) {
      displayParts.push(newSelectedItems.product);
    }
    if (newSelectedItems.styles.length > 0) {
      displayParts.push(...newSelectedItems.styles);
    }
    if (newSelectedItems.crafts.length > 0) {
      displayParts.push(...newSelectedItems.crafts);
    }
    const newDisplayText = displayParts.join('、');
    setDisplayText(newDisplayText);

    if (fullPromptTemplate) {
      const styleAndCraftElements = [...newSelectedItems.styles, ...newSelectedItems.crafts].join('、');
      let finalText = fullPromptTemplate;
      if (styleAndCraftElements) {
        finalText = fullPromptTemplate.replace('{风格和元素}', styleAndCraftElements);
      } else {
        finalText = fullPromptTemplate.replace('并加入以下风格和元素：{风格和元素}，', '');
      }
      finalText = finalText.replace(/设计\d+个款式/, `设计${styleCount}个款式`);
      setAssistantInputText(finalText);
    } else {
      setAssistantInputText(newDisplayText);
    }
  };

  const handleProductSelect = (product: { name: string; template: string }) => {
    const newSelectedItems = {
      product: product.name,
      styles: [],
      crafts: []
    };

    setFullPromptTemplate(product.template);
    setSelectedItems(newSelectedItems);
    setDisplayText(product.name);

    const templateWithCount = product.template.replace(/设计\d+个款式/, `设计${styleCount}个款式`);
    setAssistantInputText(templateWithCount);
  };

  const handleStyleSelect = (style: string) => {
    const newSelectedItems = {
      ...selectedItems,
      styles: [...selectedItems.styles, style]
    };
    setSelectedItems(newSelectedItems);
    updateTexts(newSelectedItems);
  };

  const handleCraftsConfirm = (crafts: string[]) => {
    const newSelectedItems = {
      ...selectedItems,
      crafts: crafts
    };
    setSelectedItems(newSelectedItems);
    updateTexts(newSelectedItems);
  };

  const handleStructureSelect = (structure: string) => {
    const newText = assistantInputText ? `${assistantInputText}, ${structure}` : structure;
    setAssistantInputText(newText);
  };

  const handleStyleCountChange = (count: number) => {
    setStyleCount(count);
    if (fullPromptTemplate) {
      const styleAndCraftElements = [...selectedItems.styles, ...selectedItems.crafts].join('、');
      let finalText = fullPromptTemplate;
      if (styleAndCraftElements) {
        finalText = fullPromptTemplate.replace('{风格和元素}', styleAndCraftElements);
      } else {
        finalText = fullPromptTemplate.replace('并加入以下风格和元素：{风格和元素}，', '');
      }
      finalText = finalText.replace(/设计\d+个款式/, `设计${count}个款式`);
      setAssistantInputText(finalText);
    }
  };

  const handleAssistantInputChange = (newValue: string) => {
    setAssistantInputText(newValue);
    setDisplayText(newValue);
    setFullPromptTemplate('');
    setSelectedItems({ styles: [], crafts: [] });
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
          assistantInputText={assistantInputText}
          onAssistantInputChange={handleAssistantInputChange}
          assistantImages={assistantImages}
          onAssistantImagesChange={setAssistantImages}
          displayText={displayText}
          assistantPanelProps={assistantMode === 'assistant' ? {
            onProductSelect: handleProductSelect,
            onStyleSelect: handleStyleSelect,
            onCraftsConfirm: handleCraftsConfirm,
            onStructureSelect: handleStructureSelect,
            styleCount,
            onStyleCountChange: handleStyleCountChange,
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
