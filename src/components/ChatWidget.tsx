import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Bot, User, Send, Loader2, Settings, Image, Paperclip, FileText, Images } from 'lucide-react';
import { useWidgetChat } from '../hooks/useWidgetChat';
import { useImageSelector } from '../hooks/useImageSelector';
import { StylePresetDropdown } from './StylePresetDropdown';
import { CraftSelector } from './CraftSelector';
import { ProductSelector } from './ProductSelector';
import { PromptStructureSelector } from './PromptStructureSelector';
import { useAuth } from '../contexts/AuthContext';

interface Position {
  x: number;
  y: number;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [inputText, setInputText] = useState('');
  const [widgetImages, setWidgetImages] = useState<File[]>([]);
  const [showPromptUpload, setShowPromptUpload] = useState(false);
  const [uploadedPrompts, setUploadedPrompts] = useState('');
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);

  const [displayText, setDisplayText] = useState('');
  const [fullPromptTemplate, setFullPromptTemplate] = useState('');
  const [selectedItems, setSelectedItems] = useState<{product?: string, styles: string[], crafts: string[]}>({
    styles: [],
    crafts: []
  });
  const [styleCount, setStyleCount] = useState<number>(3);

  const { user } = useAuth();
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages: widgetMessages, isLoading: widgetLoading, sendMessage: widgetSendMessage, clearChat: widgetClearChat } = useWidgetChat();
  const { openAdvancedSelector } = useImageSelector();

  useEffect(() => {
    (window as any).widgetHandleReferenceSelection = async (imageUrls: string[]) => {
      setSelectedReferenceImages(imageUrls);
      const files: File[] = [];
      for (const imageUrl of imageUrls) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const fileName = imageUrl.split('/').pop() || 'reference_image.jpg';
          const file = new File([blob], fileName, { type: blob.type });
          files.push(file);
        } catch (error) {
          console.error('Failed to convert image URL to file:', error);
        }
      }
      setWidgetImages(prev => [...prev, ...files]);
    };
    return () => {
      delete (window as any).widgetHandleReferenceSelection;
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [widgetMessages, isOpen, isMinimized]);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      const rect = widgetRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  // 处理拖拽 - 使用 requestAnimationFrame 优化性能
  useEffect(() => {
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !rafId) {
        rafId = requestAnimationFrame(() => {
          const newX = e.clientX - dragOffset.x;
          const newY = e.clientY - dragOffset.y;

          const maxX = window.innerWidth - 400;
          const maxY = window.innerHeight - 500;

          setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY))
          });
          rafId = null;
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isDragging, dragOffset]);

  // 解析AI回复中的提示词列表
  const extractPrompts = (content: string): string[] => {
    const prompts: string[] = [];

    // 方式1: 匹配双引号包裹的编号列表 (1. "xxx" 或 1. "xxx")
    const quotedNumberedMatches = content.match(/\d+\.\s*[""]([^""]+)[""]/g);
    if (quotedNumberedMatches && quotedNumberedMatches.length > 0) {
      quotedNumberedMatches.forEach(match => {
        const promptMatch = match.match(/[""]([^""]+)[""]/);
        if (promptMatch) {
          prompts.push(promptMatch[1].trim());
        }
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }

    // 方式2: 匹配编号列表格式，直接提取编号后的内容 (1. xxx)
    // 支持格式：1. 内容  或  1. 内容  或  1、内容
    const lines = content.split('\n');
    const numberedLines: string[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      // 匹配 "数字+点/顿号+空格+内容" 格式
      const match = trimmedLine.match(/^(\d+)[.、。]\s*(.+)$/);
      if (match && match[2]) {
        numberedLines.push(match[2].trim());
      }
    });

    if (numberedLines.length > 0) {
      return numberedLines.filter(prompt => prompt.trim().length > 20);
    }

    // 方式3: 匹配独立的双引号内容
    const standaloneQuotes = content.match(/[""]([^""]+)[""]/g);
    if (standaloneQuotes && standaloneQuotes.length > 0) {
      standaloneQuotes.forEach(match => {
        const promptMatch = match.match(/[""]([^""]+)[""]/);
        if (promptMatch) {
          prompts.push(promptMatch[1].trim());
        }
      });
      return prompts.filter(prompt => prompt.trim().length > 20);
    }

    // 方式4: 如果以上都没匹配到，尝试按段落分割
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    if (paragraphs.length > 0) {
      return paragraphs.map(p => p.trim()).filter(p => p.length > 20);
    }

    return [];
  };

  // 处理本地提示词上传
  const handlePromptUpload = () => {
    if (!uploadedPrompts.trim()) {
      alert('请输入提示词内容！');
      return;
    }

    // 识别提示词
    const prompts = extractPrompts(uploadedPrompts);

    if (prompts.length === 0) {
      alert('未能识别到有效的提示词（每个提示词需要大于20个字符）');
      return;
    }

    // 关闭上传弹窗
    setShowPromptUpload(false);
    setUploadedPrompts('');

    // 直接进入图片选择流程
    handleSendPromptsToMain(prompts);
  };

  // 打开图片选择器
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

  // 将提示词和统一参考图发送到主界面（批量模式）
  const sendPromptsWithUnifiedImages = (prompts: string[], images: File[]) => {
    const mainSendMessage = (window as any).mainChatSendMessage;
    if (mainSendMessage && typeof mainSendMessage === 'function') {
      // 将所有提示词用 ** ** 包裹，并明确启用批量队列模式
      const textWithPrompts = prompts.map(p => `**${p}**`).join('\n');
      mainSendMessage(textWithPrompts, images, true);
    }

    alert(`已将 ${prompts.length} 个提示词和 ${images.length} 张统一参考图发送到主界面，将自动排队绘图！`);
  };

  // 将提示词和各自的参考图分别发送到主界面
  const sendPromptsWithIndividualImages = (promptImages: { prompt: string; images: File[] }[]) => {
    const mainSendMessage = (window as any).mainChatSendMessage;
    if (mainSendMessage && typeof mainSendMessage === 'function') {
      // 如果所有提示词都使用相同的参考图（或都没有参考图），使用批量模式
      const firstImages = promptImages[0]?.images || [];
      const allSameImages = promptImages.every(({ images }) =>
        images.length === firstImages.length &&
        images.every((img, idx) => img === firstImages[idx])
      );

      if (allSameImages) {
        // 所有提示词使用相同参考图，使用批量模式
        const textWithPrompts = promptImages.map(({ prompt }) => `**${prompt}**`).join('\n');
        mainSendMessage(textWithPrompts, firstImages, true);
      } else {
        // 参考图不同，逐个发送（注意：这种情况下不会显示批量进度）
        promptImages.forEach(({ prompt, images }) => {
          mainSendMessage(`**${prompt}**`, images, true);
        });
      }
    }

    const totalImages = promptImages.reduce((sum, p) => sum + p.images.length, 0);
    alert(`已将 ${promptImages.length} 个提示词（共 ${totalImages} 张参考图）发送到主界面，将自动排队绘图！`);
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputText.trim() || widgetLoading) return;
    widgetSendMessage(inputText, widgetImages);
    setInputText('');
    setDisplayText('');
    setWidgetImages([]);
    setFullPromptTemplate('');
    setSelectedItems({ styles: [], crafts: [] });
    setStyleCount(3);

    // 重置textarea高度
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  };

  // 监听AI回复，自动检测提示词并直接发送到主界面
  useEffect(() => {
    if (widgetMessages.length > 0) {
      const lastMessage = widgetMessages[widgetMessages.length - 1];
      if (lastMessage.type === 'ai' && !widgetLoading && !lastMessage.promptsSent) {
        const prompts = extractPrompts(lastMessage.content);
        if (prompts.length > 0) {
          lastMessage.promptsSent = true;
          handleSendPromptsToMain(prompts);
        }
      }
    }
  }, [widgetMessages, widgetLoading]);

  // 处理图片选择
  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    setWidgetImages([...widgetImages, ...imageFiles]);
  };

  // 移除图片
  const removeWidgetImage = (index: number) => {
    const newImages = widgetImages.filter((_, i) => i !== index);
    setWidgetImages(newImages);
  };

  // 处理粘贴图片
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      setWidgetImages([...widgetImages, ...imageFiles]);
    }
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 更新显示文本和完整提示词
  const updateTexts = (newSelectedItems: {product?: string, styles: string[], crafts: string[]}) => {
    // 构建显示文本（用户看到的简洁版本）
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

    // 如果有模板，构建完整提示词
    if (fullPromptTemplate) {
      const styleAndCraftElements = [...newSelectedItems.styles, ...newSelectedItems.crafts].join('、');
      let finalText = fullPromptTemplate;
      if (styleAndCraftElements) {
        finalText = fullPromptTemplate.replace('{风格和元素}', styleAndCraftElements);
      } else {
        finalText = fullPromptTemplate.replace('并加入以下风格和元素：{风格和元素}，', '');
      }
      // 替换数量
      finalText = finalText.replace(/设计\d+个款式/, `设计${styleCount}个款式`);
      setInputText(finalText);
    } else {
      setInputText(newDisplayText);
    }

    setTimeout(() => adjustTextareaHeight(), 0);
  };

  // 处理风格选择
  const handleStyleSelect = (style: string) => {
    const newSelectedItems = {
      ...selectedItems,
      styles: [...selectedItems.styles, style]
    };
    setSelectedItems(newSelectedItems);
    updateTexts(newSelectedItems);
  };

  // 处理工艺选择确认
  const handleCraftsConfirm = (crafts: string[]) => {
    const newSelectedItems = {
      ...selectedItems,
      crafts: crafts
    };
    setSelectedItems(newSelectedItems);
    updateTexts(newSelectedItems);
  };

  // 处理产品选择 - 保存模板并更新显示
  const handleProductSelect = (product: { name: string; template: string }) => {
    const newSelectedItems = {
      product: product.name,
      styles: [],
      crafts: []
    };

    setFullPromptTemplate(product.template);
    setSelectedItems(newSelectedItems);
    setDisplayText(product.name);

    // 应用数量替换
    const templateWithCount = product.template.replace(/设计\d+个款式/, `设计${styleCount}个款式`);
    setInputText(templateWithCount);
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  // 处理提示词结构选择
  const handleStructureSelect = (structure: string) => {
    const newText = inputText ? `${inputText}, ${structure}` : structure;
    setInputText(newText);
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  // 自动调整textarea高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputText(newValue);
    setDisplayText(newValue);
    // 用户手动输入时清空模板和选择状态
    setFullPromptTemplate('');
    setSelectedItems({ styles: [], crafts: [] });
    adjustTextareaHeight();
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        >
          <Settings size={24} />
        </button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div
          ref={widgetRef}
          className={`fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${
            isDragging ? 'cursor-grabbing' : 'cursor-default'
          }`}
          style={{
            left: position.x,
            top: position.y,
            width: '400px',
            height: isMinimized ? '60px' : '550px'
          }}
        >
          {/* 标题栏 */}
          <div
            className="drag-handle flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <Settings size={20} />
              <span className="font-medium">客服助手</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromptUpload(true);
                }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm flex items-center gap-1 transition-colors"
                title="本地提示词上传"
              >
                <FileText size={14} />
                <span className="text-xs">提示词上传</span>
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-6 h-6 hover:bg-white/20 rounded flex items-center justify-center transition-colors"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 hover:bg-white/20 rounded flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 聊天内容 */}
          {!isMinimized && (
            <>
              {/* 消息区域 */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ height: '360px' }}>
                {widgetMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot size={32} className="mx-auto mb-2 text-gray-400" />
                    <p>你好！我是客服助手</p>
                    <p className="text-sm">有什么可以帮助你的吗？</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {widgetMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`max-w-[70%] ${message.type === 'user' ? 'text-right' : ''}`}>
                          <div className={`rounded-lg px-3 py-2 text-sm ${
                            message.type === 'user'
                              ? 'bg-blue-500 text-white'
                              : message.hasError
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-white border border-gray-200'
                          }`}>
                            {message.images && message.images.length > 0 && (
                              <div className="mb-2">
                                {message.images.map((imageUrl, index) => (
                                  <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Image ${index + 1}`}
                                    className="max-w-full h-auto rounded border"
                                  />
                                ))}
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>

                          <div className={`text-xs text-gray-500 mt-1 ${
                            message.type === 'user' ? 'text-right' : 'text-left'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {widgetLoading && (
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-orange-500" />
                            <span className="text-sm text-gray-600">正在思考...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                {/* 图片预览区域 */}
                {widgetImages.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {widgetImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-12 h-12 object-cover rounded border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removeWidgetImage(index)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          <X size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {/* 隐藏的文件输入 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageSelect(e.target.files)}
                  />
                  
                  {/* 图片上传按钮 */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                    title="上传图片"
                  >
                    <Image size={16} />
                  </button>
                  
                  <textarea
                    ref={textareaRef}
                    value={displayText || inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onPaste={handlePaste}
                    placeholder="输入消息..."
                    rows={1}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none overflow-y-auto"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                    disabled={widgetLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputText.trim() && widgetImages.length === 0) || widgetLoading}
                    className="w-10 h-10 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    {widgetLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <ProductSelector onSelectProduct={handleProductSelect} buttonText="产品" />
                  <StylePresetDropdown onSelectStyle={handleStyleSelect} buttonText="风格" />
                  <CraftSelector onConfirm={handleCraftsConfirm} buttonText="工艺" />

                  {/* 款式数量输入 */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <span className="text-xs text-gray-700 font-medium">款式数量:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={styleCount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 10;
                        const newCount = Math.max(1, Math.min(20, value));
                        setStyleCount(newCount);
                        // 如果有模板，立即更新（使用新的count值）
                        if (fullPromptTemplate) {
                          const styleAndCraftElements = [...selectedItems.styles, ...selectedItems.crafts].join('、');
                          let finalText = fullPromptTemplate;
                          if (styleAndCraftElements) {
                            finalText = fullPromptTemplate.replace('{风格和元素}', styleAndCraftElements);
                          } else {
                            finalText = fullPromptTemplate.replace('并加入以下风格和元素：{风格和元素}，', '');
                          }
                          // 使用新的数量值替换
                          finalText = finalText.replace(/设计\d+个款式/, `设计${newCount}个款式`);
                          setInputText(finalText);
                          setTimeout(() => adjustTextareaHeight(), 0);
                        }
                      }}
                      className="w-12 px-1.5 py-0.5 text-sm text-center border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
                    />
                    <span className="text-xs text-gray-600">个</span>
                  </div>

                  <PromptStructureSelector onSelectStructure={handleStructureSelect} buttonText="用户提示词自定义" />
                  <button
                    onClick={() => {
                      if ((window as any).openReferenceLibrary) {
                        (window as any).openReferenceLibrary();
                      }
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1"
                  >
                    <Images size={14} />
                    参考图库
                    {selectedReferenceImages.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                        {selectedReferenceImages.length}
                      </span>
                    )}
                  </button>
                </div>

                {widgetMessages.length > 0 && (
                  <button
                    onClick={widgetClearChat}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-2 transition-colors"
                  >
                    清空对话
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 本地提示词上传弹窗 */}
      {showPromptUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowPromptUpload(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗标题 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-800">本地提示词上传</h3>
              </div>
              <button
                onClick={() => setShowPromptUpload(false)}
                className="w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 弹窗内容 */}
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
                className="w-full h-[300px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                提示：每个提示词需要大于20个字符才能被识别
              </p>
            </div>

            {/* 弹窗底部按钮 */}
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
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                识别并上传
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};