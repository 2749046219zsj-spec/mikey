import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContactModal } from './components/ContactModal';
import ReferenceImageLibrary from './components/ReferenceImageLibrary';
import { useChat } from './hooks/useChat';
import { useAuth } from './contexts/AuthContext';
import { userService } from './services/userService';
import { useImageSelector } from './hooks/useImageSelector';
import { GeminiApiService } from './services/geminiApi';

export default function AppContent() {
  const { user, refreshUserData } = useAuth();
  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  const { addImageToUnified } = useImageSelector();

  const [assistantMode, setAssistantMode] = useState<'normal' | 'assistant'>('normal');
  const [styleCount, setStyleCount] = useState(3);
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);
  const [assistantMessages, setAssistantMessages] = useState<any[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const [assistantInputText, setAssistantInputText] = useState('');
  const [assistantImages, setAssistantImages] = useState<File[]>([]);
  const [displayText, setDisplayText] = useState('');
  const [fullPromptTemplate, setFullPromptTemplate] = useState('');
  const [selectedItems, setSelectedItems] = useState<{product?: string, styles: string[], crafts: string[]}>({
    styles: [],
    crafts: []
  });

  const geminiService = React.useMemo(() => new GeminiApiService(), []);

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


  const handleSendMessage = async (text: string, images: File[]) => {
    if (!user) return;

    if (assistantMode === 'assistant') {
      const imageUrls = images.map(img => URL.createObjectURL(img));
      const userMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        images: imageUrls,
        originalText: text,
        originalImages: images,
        timestamp: new Date()
      };
      setAssistantMessages(prev => [...prev, userMessage]);

      setAssistantInputText('');
      setDisplayText('');
      setAssistantImages([]);
      setFullPromptTemplate('');
      setSelectedItems({ styles: [], crafts: [] });
      setStyleCount(3);

      setAssistantLoading(true);

      try {
        const systemPrompt = {
          role: "system",
          content: `你是一个专业的提示词识别和优化专家。你的任务是从给定文本中快速识别并优化提示词。

**任务要求：**
1. 从输入文本中识别潜在的提示词段落
2. 筛选条件：提示词长度必须大于20个字符
3. 对识别出的提示词进行优化改进
4. 上下文分析：考虑前后文的完整性，确保提示词完整

**输出格式（支持以下任意一种）：**

格式1：编号列表（推荐，最常用）
1. 优化后的提示词内容1
2. 优化后的提示词内容2
3. 优化后的提示词内容3

格式2：双引号编号列表
1. "优化后的提示词内容1"
2. "优化后的提示词内容2"
3. "优化后的提示词内容3"

**重要规则：**
- 每个提示词必须长度大于20个字符
- 保持提示词的完整性，不要截断
- 如果用户输入已经是编号列表格式，直接优化输出即可
- 每行一个提示词，确保格式清晰`
        };

        const conversationHistory = [
          systemPrompt,
          ...assistantMessages.map(msg => {
            if (msg.type === 'user') {
              const content = [];
              if (msg.originalText && msg.originalText.trim()) {
                content.push({
                  type: "text",
                  text: msg.originalText
                });
              }
              return {
                role: "user",
                content: content.length > 0 ? content : [{ type: "text", text: msg.content }]
              };
            } else {
              const cleanContent = msg.content.replace(/(https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi, '').replace(/!\[generated_image_\d+\]/g, '').replace(/\(\s*\)/g, '').replace(/\n\s*\n/g, '\n').trim();
              return {
                role: "assistant",
                content: cleanContent || msg.content
              };
            }
          }),
          {
            role: "user",
            content: [{ type: "text", text: text }]
          }
        ];

        const response = await geminiService.sendMessage(text, images, 'Gemini-2.5-Flash-Image', conversationHistory);

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response,
          timestamp: new Date()
        };
        setAssistantMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `生成失败: ${errorMessage}`,
          hasError: true,
          timestamp: new Date()
        };
        setAssistantMessages(prev => [...prev, aiMessage]);
      } finally {
        setAssistantLoading(false);
      }
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
          isLoading={assistantMode === 'assistant' ? assistantLoading : isLoading}
          queueInfo={queueInfo}
          onStopQueue={stopQueue}
          onClearQueue={clearQueue}
          assistantMode={assistantMode}
          onModeChange={setAssistantMode}
        />

        <ChatContainer
          messages={assistantMode === 'assistant' ? assistantMessages : messages}
          isLoading={assistantMode === 'assistant' ? assistantLoading : isLoading}
          error={error}
          onRetryToInput={retryToInput}
          onSetEditContent={handleSetEditContent}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={assistantMode === 'assistant' ? assistantLoading : isLoading}
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
