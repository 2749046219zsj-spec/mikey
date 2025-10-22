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
import { GeminiApiService } from './services/geminiApi';

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
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [showPromptUpload, setShowPromptUpload] = useState(false);
  const [uploadedPrompts, setUploadedPrompts] = useState('');

  const [assistantInputText, setAssistantInputText] = useState('');
  const [assistantImages, setAssistantImages] = useState<File[]>([]);
  const [displayText, setDisplayText] = useState('');
  const [fullPromptTemplate, setFullPromptTemplate] = useState('');
  const [selectedItems, setSelectedItems] = useState<{product?: string, styles: string[], crafts: string[]}>({
    styles: [],
    crafts: []
  });

  const geminiService = React.useMemo(() => new GeminiApiService(), []);
  const { openAdvancedSelector } = useImageSelector();

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
          })
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

  const extractPrompts = (content: string): string[] => {
    const prompts: string[] = [];

    const quotedNumberedMatches = content.match(/\d+\.\s*["""]([^"""]+)["""]/g);
    if (quotedNumberedMatches && quotedNumberedMatches.length > 0) {
      quotedNumberedMatches.forEach(match => {
        const promptMatch = match.match(/["""]([^"""]+)["""]/);
        if (promptMatch) {
          prompts.push(promptMatch[1].trim());
        }
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }

    const lines = content.split('\n');
    const numberedLines: string[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      const match = trimmedLine.match(/^(\d+)[.、。]\s*(.+)$/);
      if (match && match[2]) {
        numberedLines.push(match[2].trim());
      }
    });

    if (numberedLines.length > 0) {
      return numberedLines.filter(prompt => prompt.trim().length > 20);
    }

    const standaloneQuotes = content.match(/["""]([^"""]+)["""]/g);
    if (standaloneQuotes && standaloneQuotes.length > 0) {
      standaloneQuotes.forEach(match => {
        const promptMatch = match.match(/["""]([^"""]+)["""]/);
        if (promptMatch) {
          prompts.push(promptMatch[1].trim());
        }
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }

    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    if (paragraphs.length > 0) {
      return paragraphs.map(p => p.trim()).filter(p => p.length > 20);
    }

    return [];
  };

  const handlePromptUpload = () => {
    if (!uploadedPrompts.trim()) {
      alert('请输入提示词内容！');
      return;
    }

    const prompts = extractPrompts(uploadedPrompts);

    if (prompts.length === 0) {
      alert('未能识别到有效的提示词（每个提示词需要大于20个字符）');
      return;
    }

    setShowPromptUpload(false);
    setUploadedPrompts('');
    handleSendPromptsToMain(prompts);
  };

  const handleSendPromptsToMain = (prompts: string[]) => {
    if (prompts.length === 0) return;

    openAdvancedSelector(prompts, (result) => {
      if (result.mode === 'unified' && result.unifiedImages) {
        sendPromptsWithUnifiedImages(prompts, result.unifiedImages);
      } else if (result.mode === 'individual' && result.promptImages) {
        sendPromptsWithIndividualImages(result.promptImages);
      }
    });
  };

  const sendPromptsWithUnifiedImages = (prompts: string[], images: File[]) => {
    const textWithPrompts = prompts.map(p => `**${p}**`).join('\n');
    sendMessage(textWithPrompts, images, true);
    alert(`已将 ${prompts.length} 个提示词和 ${images.length} 张统一参考图添加到队列，将自动排队绘图！`);
  };

  const sendPromptsWithIndividualImages = (promptImages: { prompt: string; images: File[] }[]) => {
    const firstImages = promptImages[0]?.images || [];
    const allSameImages = promptImages.every(({ images }) =>
      images.length === firstImages.length &&
      images.every((img, idx) => img === firstImages[idx])
    );

    if (allSameImages) {
      const textWithPrompts = promptImages.map(({ prompt }) => `**${prompt}**`).join('\n');
      sendMessage(textWithPrompts, firstImages, true);
    } else {
      promptImages.forEach(({ prompt, images }) => {
        sendMessage(`**${prompt}**`, images, true);
      });
    }

    const totalImages = promptImages.reduce((sum, p) => sum + p.images.length, 0);
    alert(`已将 ${promptImages.length} 个提示词（共 ${totalImages} 张参考图）添加到队列，将自动排队绘图！`);
  };

  const handleConfirmSendPrompts = (messageId: string) => {
    const message = assistantMessages.find(m => m.id === messageId);
    if (!message || message.type !== 'ai') return;

    const prompts = extractPrompts(message.content);
    if (prompts.length > 0) {
      setAssistantMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, promptsSent: true } : m
      ));
      handleSendPromptsToMain(prompts);
    }
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
          assistantMode={assistantMode === 'assistant'}
          onConfirmSendPrompts={handleConfirmSendPrompts}
          extractPrompts={extractPrompts}
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
            onOpenPromptUpload: () => setShowPromptUpload(true),
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

        {showPromptUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowPromptUpload(false)}>
            <div className="bg-white rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">提示词上传</h3>
                <button
                  onClick={() => setShowPromptUpload(false)}
                  className="w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-gray-600 mb-3">
                  请在下方粘贴您的提示词列表。支持的格式：
                </p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1 pl-4">
                  <li>• 编号列表：1. 提示词内容</li>
                  <li>• 双引号列表：1. "提示词内容"</li>
                  <li>• 中文顿号：1、提示词内容</li>
                </ul>
                <textarea
                  value={uploadedPrompts}
                  onChange={(e) => setUploadedPrompts(e.target.value)}
                  placeholder={'请粘贴提示词，例如：\n\n1. 根据我这个产品结构进行设计效果图：一个洛可可风格的香水瓶...\n2. 根据我这个产品结构进行设计效果图：一个充满洛可可浪漫气息的香氛容器...\n3. 根据我这个产品结构进行设计效果图：一张产品渲染图...'}
                  className="w-full h-[300px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  提示：每个提示词需要大于20个字符才能被识别
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPromptUpload(false);
                    setUploadedPrompts('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handlePromptUpload}
                  disabled={!uploadedPrompts.trim()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  识别并上传
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
