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
import { ProductCatalog } from './components/catalog/ProductCatalog';
import { AutoCineButton } from './components/AutoCineButton';
import { AutoCinePanel } from './components/AutoCinePanel';
import { SeedreamConfig, getDefaultSeedreamConfig } from './components/SeedreamSettings';
import { NanoBananaConfig, getDefaultNanoBananaConfig } from './components/NanoBananaSettings';
import { useChat } from './hooks/useChat';
import { useWidgetChat } from './hooks/useWidgetChat';
import { useAuth } from './contexts/AuthContext';
import { userService } from './services/userService';
import { useImageSelector } from './hooks/useImageSelector';
import { Image as ImageIcon, Sparkles, Wrench, Film } from 'lucide-react';
import { useReferenceImageStore } from './stores/referenceImageStore';

interface AppContentProps {
  onShowAuth?: (mode: 'login' | 'register') => void;
  shouldEnterCreation?: boolean;
  onCreationEntered?: () => void;
  onShowDashboard?: () => void;
}

export default function AppContent({ onShowAuth, shouldEnterCreation, onCreationEntered, onShowDashboard }: AppContentProps) {
  const { user, refreshUserData } = useAuth();
  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  const [showGallery, setShowGallery] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAutoCine, setShowAutoCine] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>('normal');
  const [hasOpenedReferenceLibrary, setHasOpenedReferenceLibrary] = useState(false);
  const { addImageToUnified, selectedImages: referenceImages, openAdvancedSelector, removeImageFromUnified } = useImageSelector();
  const { selectedImages: selectedReferenceImages, addImage: addReferenceImage } = useReferenceImageStore();

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
  const [seedreamConfig, setSeedreamConfig] = useState<SeedreamConfig>(getDefaultSeedreamConfig());
  const [nanoBananaConfig, setNanoBananaConfig] = useState<NanoBananaConfig>(getDefaultNanoBananaConfig());

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
  } = useChat(checkAndDecrementDraws, seedreamConfig, nanoBananaConfig);

  const {
    messages: assistantMessages,
    isLoading: assistantLoading,
    error: assistantError,
    sendMessage: assistantSendMessage,
    clearChat: assistantClearChat,
    retryToInput: assistantRetryToInput
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

    // 方法1: 匹配双引号格式 1. "内容"
    const quotedNumberedMatches = content.match(/\d+\.\s*[""]([^""]+)[""]/g);
    if (quotedNumberedMatches && quotedNumberedMatches.length > 0) {
      quotedNumberedMatches.forEach(match => {
        const promptMatch = match.match(/[""]([^""]+)[""]/);
        if (promptMatch) prompts.push(promptMatch[1].trim());
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }

    // 方法2: 直接按编号分割，支持跨行长文本格式
    // 先按编号位置分割文本
    const numberPattern = /(?:^|\n)(\d+)[.、。]\s+/g;
    const positions: Array<{ index: number; number: number }> = [];
    let match: RegExpExecArray | null;

    while ((match = numberPattern.exec(content)) !== null) {
      positions.push({
        index: match.index + (match[0].startsWith('\n') ? 1 : 0),
        number: parseInt(match[1])
      });
    }

    // 提取每个编号之间的内容
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index;
      const end = i < positions.length - 1 ? positions[i + 1].index : content.length;

      // 提取从当前编号到下一个编号之间的所有文本
      let promptText = content.substring(start, end).trim();

      // 移除开头的编号标记
      promptText = promptText.replace(/^\d+[.、。]\s+/, '');

      // 清理markdown格式符号
      promptText = promptText
        // 移除 **标题**: 或 **标题**:
        .replace(/\*\*([^*]+)\*\*[:：]\s*/g, '$1: ')
        // 移除其他 ** 包裹
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        // 移除【】包裹
        .replace(/【([^】]+)】[:：]?\s*/g, '$1: ')
        // 移除多余的换行（保留段落结构但合并为单行）
        .replace(/\n+/g, ' ')
        // 移除多余空格
        .replace(/\s+/g, ' ')
        .trim();

      if (promptText.length > 20) {
        prompts.push(promptText);
      }
    }

    // 如果方法2没有找到，尝试方法3: 简单按行匹配
    if (prompts.length === 0) {
      const lines = content.split('\n');
      const numberedLines: string[] = [];
      lines.forEach(line => {
        const trimmedLine = line.trim();
        const lineMatch = trimmedLine.match(/^(\d+)[.、。]\s*(.+)$/);
        if (lineMatch && lineMatch[2]) {
          // 清理markdown格式
          let cleanText = lineMatch[2]
            .replace(/\*\*([^*]+)\*\*[:：]?\s*/g, '$1: ')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .trim();
          numberedLines.push(cleanText);
        }
      });
      if (numberedLines.length > 0) return numberedLines.filter(prompt => prompt.trim().length > 20);
    }

    return prompts.filter(prompt => prompt.trim().length > 20);
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

  const handleGallerySubmit = async (prompt: string, images: File[]) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!canUseChat) {
      setShowContactModal(true);
      return;
    }

    const canProceed = await checkAndDecrementDraws();
    if (!canProceed) return;

    setShowGallery(false);
    setCurrentMode('normal');

    sendMessage(prompt, images);
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
      {showAutoCine ? (
        <div className="min-h-screen bg-slate-950 flex flex-col">
          <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                    <Film size={20} className="text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-slate-200">AutoCine - AI 视频分镜生成</h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowAutoCine(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    <ImageIcon size={16} />
                    返回
                  </button>

                  {user && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="text-sm text-slate-400">剩余绘图次数:</span>
                        <span className="text-sm font-bold text-blue-400">
                          {user.permissions.remaining_draws}
                        </span>
                      </div>
                      <button
                        onClick={onShowDashboard}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                      >
                        我的账户
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <AutoCinePanel />
        </div>
      ) : showGallery ? (
        <div className="min-h-screen bg-elegant-cream flex flex-col">
          <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-3">
              {/* 统一的导航栏 */}
              <div className="flex items-center justify-between">
                {/* 左侧：Logo 和标题 */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                    <ImageIcon size={20} className="text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-gray-800">AI 创意助手</h1>
                </div>

                {/* 右侧：操作按钮 */}
                <div className="flex items-center gap-2">
                  {/* 浏览画廊 - 当前在画廊页面 */}
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm rounded-lg shadow-sm font-medium cursor-default"
                  >
                    <ImageIcon size={16} />
                    浏览画廊
                  </button>

                  {/* AutoCine 按钮 */}
                  <AutoCineButton
                    onClick={() => {
                      setShowAutoCine(true);
                    }}
                    isActive={false}
                  />

                  {/* 普通模式按钮 */}
                  <button
                    onClick={() => {
                      handleStartCreating();
                      setCurrentMode('normal');
                      setShowAutoCine(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Sparkles size={16} />
                    普通模式
                  </button>

                  {/* 专业模式按钮 */}
                  {canUseChat && (
                    <button
                      onClick={() => {
                        handleStartCreating();
                        setCurrentMode('professional');
                        setShowAutoCine(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      <Wrench size={16} />
                      专业模式
                    </button>
                  )}

                  {/* 剩余次数和账户按钮 */}
                  {user && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600">剩余绘图次数:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {user.permissions.remaining_draws}
                        </span>
                      </div>
                      <button
                        onClick={onShowDashboard}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                      >
                        我的账户
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <PublicGallery onSubmitGeneration={handleGallerySubmit} />
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
            onShowDashboard={onShowDashboard}
            onShowAutoCine={() => setShowAutoCine(true)}
            seedreamConfig={seedreamConfig}
            onSeedreamConfigChange={setSeedreamConfig}
            nanoBananaConfig={nanoBananaConfig}
            onNanoBananaConfigChange={setNanoBananaConfig}
          />

        <ChatContainer
          messages={currentMode === 'professional' ? assistantMessages : messages}
          isLoading={currentMode === 'professional' ? assistantLoading : isLoading}
          error={currentMode === 'professional' ? assistantError : error}
          onRetryToInput={currentMode === 'professional' ? assistantRetryToInput : retryToInput}
          onSetEditContent={handleSetEditContent}
          isProfessionalMode={currentMode === 'professional'}
          onSendPromptsToGenerate={handleAssistantMessageAction}
          sentMessageIds={sentMessageIds}
        />

        {currentMode === 'professional' && canUseChat && (
          <>
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
