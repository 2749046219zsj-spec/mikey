import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader, AppMode } from './components/ChatHeader';
import { ProfessionalToolbar } from './components/ProfessionalToolbar';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ImageSelector } from './components/ImageSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContactModal } from './components/ContactModal';
import ReferenceImageLibrary from './components/ReferenceImageLibrary';
import { PublicGallery } from './components/PublicGallery';
import { LoginPromptModal } from './components/LoginPromptModal';
import { useChat } from './hooks/useChat';
import { useWidgetChat } from './hooks/useWidgetChat';
import { useAuth } from './contexts/AuthContext';
import { userService } from './services/userService';
import { useImageSelector } from './hooks/useImageSelector';
import { Image as ImageIcon, X } from 'lucide-react';
import { useReferenceImageStore } from './stores/referenceImageStore';

interface AppContentProps {
  onShowAuth?: (mode: 'login' | 'register') => void;
  shouldEnterCreation?: boolean;
  onCreationEntered?: () => void;
}

export default function AppContent({ onShowAuth, shouldEnterCreation, onCreationEntered }: AppContentProps) {
  const { user, refreshUserData } = useAuth();
  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  const [showGallery, setShowGallery] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>('normal');
  const [hasOpenedReferenceLibrary, setHasOpenedReferenceLibrary] = useState(false);
  const { addImageToUnified, selectedImages: referenceImages, openAdvancedSelector, removeImageFromUnified } = useImageSelector();
  const { selectedImages: selectedReferenceImages, removeImage: removeReferenceImage } = useReferenceImageStore();

  useEffect(() => {
    if (shouldEnterCreation && user) {
      setShowGallery(false);
      onCreationEntered?.();
    }
  }, [shouldEnterCreation, user, onCreationEntered]);

  const [styleCount, setStyleCount] = useState(3);
  const [inputText, setInputText] = useState('');
  const [fullPromptTemplate, setFullPromptTemplate] = useState('');
  const [selectedItems, setSelectedItems] = useState<{product?: string, styles: string[], crafts: string[]}>({styles: [], crafts: []});
  const [showPromptUpload, setShowPromptUpload] = useState(false);
  const [uploadedPrompts, setUploadedPrompts] = useState('');
  const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(new Set());

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

  const {
    messages: assistantMessages,
    isLoading: assistantLoading,
    error: assistantError,
    sendMessage: assistantSendMessage,
    clearChat: assistantClearChat
  } = useWidgetChat();


  const handleSendMessage = async (text: string, images: File[]) => {
    if (!user) return;

    if (currentMode === 'professional') {
      // 专业模式：使用客服助手的语言模型进行提示词优化
      assistantSendMessage(text, images);
      setEditContent(null);
      setInputText('');
      setSelectedItems({ styles: [], crafts: [] });
      setFullPromptTemplate('');
    } else {
      // 普通模式：直接使用主界面的生成功能
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

  useEffect(() => {
    if (currentMode === 'professional' && canUseChat && !hasOpenedReferenceLibrary) {
      setShowReferenceLibrary(true);
      setHasOpenedReferenceLibrary(true);
    }
  }, [currentMode, canUseChat, hasOpenedReferenceLibrary]);

  const handleReferenceLibrarySelect = async (imageUrls: string[]) => {
    console.log('Selected images from library:', imageUrls);

    for (const imageUrl of imageUrls) {
      try {
        const response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit'
        });
        const blob = await response.blob();
        const fileName = imageUrl.split('/').pop()?.split('?')[0] || 'reference_image.jpg';
        const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
        addImageToUnified(file);
      } catch (error) {
        console.error('Failed to convert image URL to file:', imageUrl, error);
      }
    }

    setShowReferenceLibrary(false);
  };

  const handleReferenceLibraryBack = () => {
    setShowReferenceLibrary(false);
  };

  const updateTexts = React.useCallback((newSelectedItems: {product?: string, styles: string[], crafts: string[]}) => {
    const displayParts: string[] = [];
    if (newSelectedItems.product) displayParts.push(newSelectedItems.product);
    if (newSelectedItems.styles.length > 0) displayParts.push(...newSelectedItems.styles);
    if (newSelectedItems.crafts.length > 0) displayParts.push(...newSelectedItems.crafts);
    const newDisplayText = displayParts.join('、');

    if (fullPromptTemplate) {
      const styleAndCraftElements = [...newSelectedItems.styles, ...newSelectedItems.crafts].join('、');
      let finalText = fullPromptTemplate;
      if (styleAndCraftElements) {
        finalText = fullPromptTemplate.replace('{风格和元素}', styleAndCraftElements);
      } else {
        finalText = fullPromptTemplate.replace('并加入以下风格和元素：{风格和元素}，', '');
      }
      finalText = finalText.replace(/设计\d+个款式/, `设计${styleCount}个款式`);
      setInputText(finalText);
    } else {
      setInputText(newDisplayText);
    }
  }, [fullPromptTemplate, styleCount]);

  const handleStyleSelect = (style: string) => {
    const newSelectedItems = {...selectedItems, styles: [...selectedItems.styles, style]};
    setSelectedItems(newSelectedItems);
    updateTexts(newSelectedItems);
  };

  const handleCraftsConfirm = (crafts: string[]) => {
    const newSelectedItems = {...selectedItems, crafts};
    setSelectedItems(newSelectedItems);
    updateTexts(newSelectedItems);
  };

  const handleProductSelect = (product: { name: string; template: string }) => {
    const newSelectedItems = {product: product.name, styles: [], crafts: []};
    setFullPromptTemplate(product.template);
    setSelectedItems(newSelectedItems);
    const templateWithCount = product.template.replace(/设计\d+个款式/, `设计${styleCount}个款式`);
    setInputText(templateWithCount);
  };

  const handleStructureSelect = (structure: string) => {
    const newText = inputText ? `${inputText}, ${structure}` : structure;
    setInputText(newText);
  };

  const extractPrompts = (content: string): string[] => {
    const prompts: string[] = [];
    const quotedNumberedMatches = content.match(/\d+\.\s*[""]([^""]+)[""]/g);
    if (quotedNumberedMatches && quotedNumberedMatches.length > 0) {
      quotedNumberedMatches.forEach(match => {
        const promptMatch = match.match(/[""]([^""]+)[""]/);
        if (promptMatch) prompts.push(promptMatch[1].trim());
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }
    const lines = content.split('\n');
    const numberedLines: string[] = [];
    lines.forEach(line => {
      const trimmedLine = line.trim();
      const match = trimmedLine.match(/^(\d+)[.、。]\s*(.+)$/);
      if (match && match[2]) numberedLines.push(match[2].trim());
    });
    if (numberedLines.length > 0) return numberedLines.filter(prompt => prompt.trim().length > 20);
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
    handleSendPromptsToGenerate(prompts);
  };

  const handleSendPromptsToGenerate = (prompts: string[]) => {
    if (prompts.length === 0) return;

    openAdvancedSelector(prompts, async (result) => {
      if (result.mode === 'unified' && result.unifiedImages) {
        const textWithPrompts = prompts.map(p => `**${p}**`).join('\n');

        let successCount = 0;
        for (let i = 0; i < prompts.length; i++) {
          const canProceed = await checkAndDecrementDraws();
          if (!canProceed) {
            if (successCount > 0) {
              alert(`已成功发送 ${successCount} 个提示词，剩余提示词因次数不足未能发送`);
            }
            return;
          }
          successCount++;
        }

        sendMessage(textWithPrompts, result.unifiedImages, true);
      } else if (result.mode === 'individual' && result.promptImages) {
        const firstImages = result.promptImages[0]?.images || [];
        const allSameImages = result.promptImages.every(({ images }) =>
          images.length === firstImages.length &&
          images.every((img, idx) => img === firstImages[idx])
        );

        let successCount = 0;
        for (let i = 0; i < result.promptImages.length; i++) {
          const canProceed = await checkAndDecrementDraws();
          if (!canProceed) {
            if (successCount > 0) {
              alert(`已成功发送 ${successCount} 个提示词，剩余提示词因次数不足未能发送`);
            }
            return;
          }
          successCount++;
        }

        if (allSameImages) {
          const textWithPrompts = result.promptImages.map(({ prompt }) => `**${prompt}**`).join('\n');
          sendMessage(textWithPrompts, firstImages, true);
        } else {
          result.promptImages.forEach(({ prompt, images }) => {
            sendMessage(`**${prompt}**`, images, true);
          });
        }
      }
    });
  };

  const handleAssistantMessageAction = (messageId: string, prompts: string[]) => {
    setSentMessageIds(prev => new Set(prev).add(messageId));
    handleSendPromptsToGenerate(prompts);
  };

  const handleStartCreating = () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      setShowGallery(false);
    }
  };

  const handleLoginPromptLogin = () => {
    setShowLoginPrompt(false);
    onShowAuth?.('login');
  };

  const handleLoginPromptRegister = () => {
    setShowLoginPrompt(false);
    onShowAuth?.('register');
  };

  return (
    <ErrorBoundary>
      {showGallery ? (
        <div className="h-screen bg-slate-50 flex flex-col overflow-y-auto">
          <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">AI 创意画廊</h1>
                </div>
                <button
                  onClick={handleStartCreating}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-md font-medium"
                >
                  开始创作
                </button>
              </div>
            </div>
          </div>
          <PublicGallery />
          <ImageModal />
          <LoginPromptModal
            isOpen={showLoginPrompt}
            onClose={() => setShowLoginPrompt(false)}
            onLogin={handleLoginPromptLogin}
            onRegister={handleLoginPromptRegister}
          />
        </div>
      ) : (
        <div className="h-screen bg-slate-50 flex flex-col">
          <ChatHeader
            onClearChat={currentMode === 'professional' ? assistantClearChat : clearChat}
            messageCount={currentMode === 'professional' ? assistantMessages.length : messages.length}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isLoading={isLoading}
            queueInfo={queueInfo}
            onStopQueue={stopQueue}
            onClearQueue={clearQueue}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
            canUseProfessionalMode={canUseChat}
            onShowGallery={() => setShowGallery(true)}
          />

        <ChatContainer
          messages={currentMode === 'professional' ? assistantMessages : messages}
          isLoading={currentMode === 'professional' ? assistantLoading : isLoading}
          error={currentMode === 'professional' ? assistantError : error}
          onRetryToInput={retryToInput}
          onSetEditContent={handleSetEditContent}
          isProfessionalMode={currentMode === 'professional'}
          onSendPromptsToGenerate={handleAssistantMessageAction}
          sentMessageIds={sentMessageIds}
        />

        {currentMode === 'professional' && canUseChat && (
          <>
            {selectedReferenceImages.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t border-b border-green-200">
                <div className="max-w-4xl mx-auto px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      <h3 className="text-sm font-semibold text-green-900">
                        已选择的参考图片 ({selectedReferenceImages.length})
                      </h3>
                    </div>
                    <button
                      onClick={() => useReferenceImageStore.getState().clearImages()}
                      className="text-xs text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      清空所有
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedReferenceImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-green-400 shadow-md hover:shadow-xl transition-all"
                      >
                        <img
                          src={image.thumbnailUrl || image.url}
                          alt={image.fileName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <button
                            onClick={() => removeReferenceImage(image.id)}
                            className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                          ✓
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    这些图片将作为参考，在接下来的操作中自动保持选中状态
                  </p>
                </div>
              </div>
            )}

            <ProfessionalToolbar
              onStyleSelect={handleStyleSelect}
              onCraftsConfirm={handleCraftsConfirm}
              onProductSelect={handleProductSelect}
              onStructureSelect={handleStructureSelect}
              onOpenPromptUpload={() => setShowPromptUpload(true)}
              onOpenReferenceLibrary={() => setShowReferenceLibrary(true)}
              styleCount={styleCount}
              onStyleCountChange={setStyleCount}
              selectedReferenceCount={selectedReferenceImages.length}
            />

            {/* 参考图显示区域 - 在工具栏和输入框之间 */}
            {referenceImages.length > 0 && (
              <div className="bg-white border-t border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {referenceImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-orange-300 group"
                      >
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImageFromUnified(index)}
                          className="absolute top-0.5 right-0.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <span className="text-white text-xs font-bold">×</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={currentMode === 'professional' ? assistantLoading : isLoading}
          editContent={editContent}
          onClearEditContent={handleClearEditContent}
          isProfessionalMode={currentMode === 'professional' && canUseChat}
          professionalModeText={inputText}
          onProfessionalTextChange={setInputText}
        />

          <ImageModal />
          <ImageGallery />
          <ImageSelector />
          <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

          {showReferenceLibrary && (
            <ReferenceImageLibrary
            onBack={handleReferenceLibraryBack}
            onSelectImages={handleReferenceLibrarySelect}
          />
        )}

          {showPromptUpload && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowPromptUpload(false)}>
            <div className="bg-white rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">本地提示词上传</h3>
                <button onClick={() => setShowPromptUpload(false)} className="w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center transition-colors">
                  <span className="text-xl">&times;</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-gray-600 mb-3">请在下方粘贴您的提示词列表。支持的格式：</p>
                <ul className="text-sm text-gray-600 mb-4 space-y-1 pl-4">
                  <li>• 编号列表：1. 提示词内容</li>
                  <li>• 双引号列表：1. "提示词内容"</li>
                  <li>• 中文顿号：1、提示词内容</li>
                </ul>
                <textarea
                  value={uploadedPrompts}
                  onChange={(e) => setUploadedPrompts(e.target.value)}
                  placeholder="请粘贴提示词，例如：\n\n1. 根据我这个产品结构进行设计效果图：一个洛可可风格的香水瓶...\n2. 根据我这个产品结构进行设计效果图：一个充满洛可可浪漫气息的香氛容器..."
                  className="w-full h-[300px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">提示：每个提示词需要大于20个字符才能被识别</p>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                <button onClick={() => { setShowPromptUpload(false); setUploadedPrompts(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                <button onClick={handlePromptUpload} disabled={!uploadedPrompts.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">识别并上传</button>
              </div>
            </div>
            </div>
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}
