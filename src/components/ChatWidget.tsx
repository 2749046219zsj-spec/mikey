import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Bot, User, Send, Loader2, Settings, Image, Paperclip } from 'lucide-react';
import { useWidgetChat } from '../hooks/useWidgetChat';
import { useImageSelector } from '../hooks/useImageSelector';
import { StylePresetDropdown } from './StylePresetDropdown';
import { CraftSelector } from './CraftSelector';
import { ProductSelector } from './ProductSelector';
import { PromptStructureSelector } from './PromptStructureSelector';

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
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages: widgetMessages, isLoading: widgetLoading, sendMessage: widgetSendMessage, clearChat: widgetClearChat } = useWidgetChat();
  const { openAdvancedSelector } = useImageSelector();

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

  // 处理拖拽
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // 限制在窗口范围内
        const maxX = window.innerWidth - 400;
        const maxY = window.innerHeight - 500;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // 解析AI回复中的提示词列表
  const extractPrompts = (content: string): string[] => {
    const prompts: string[] = [];

    // 匹配编号列表格式 (1. 2. 3. 等)
    const numberedMatches = content.match(/\d+\.\s*"[^"]+"/g);
    if (numberedMatches) {
      numberedMatches.forEach(match => {
        // 提取 " " 之间的内容作为提示词
        const promptMatch = match.match(/"([^"]+)"/);
        if (promptMatch) {
          prompts.push(promptMatch[1].trim());
        }
      });
    }

    // 如果没有找到编号格式，尝试其他格式
    if (prompts.length === 0) {
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.includes('"') && line.includes('"')) {
          const promptMatch = line.match(/"([^"]+)"/);
          if (promptMatch) {
            prompts.push(promptMatch[1].trim());
          }
        }
      });
    }

    return prompts.filter(prompt => prompt.trim().length > 20); // 过滤长度小于等于20字符的内容
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

  // 将提示词和统一参考图发送到主界面
  const sendPromptsWithUnifiedImages = (prompts: string[], images: File[]) => {
    const mainSendMessage = (window as any).mainChatSendMessage;
    if (mainSendMessage && typeof mainSendMessage === 'function') {
      const textWithPrompts = prompts.map(p => `"${p}"`).join('\n');
      mainSendMessage(textWithPrompts, images);
    }

    alert(`已将 ${prompts.length} 个提示词和 ${images.length} 张统一参考图发送到主界面进行绘图！`);
  };

  // 将提示词和各自的参考图分别发送到主界面
  const sendPromptsWithIndividualImages = (promptImages: { prompt: string; images: File[] }[]) => {
    const mainSendMessage = (window as any).mainChatSendMessage;
    if (mainSendMessage && typeof mainSendMessage === 'function') {
      promptImages.forEach(({ prompt, images }) => {
        if (images.length > 0) {
          mainSendMessage(`"${prompt}"`, images);
        } else {
          mainSendMessage(`"${prompt}"`, []);
        }
      });
    }

    const totalImages = promptImages.reduce((sum, p) => sum + p.images.length, 0);
    alert(`已将 ${promptImages.length} 个提示词（共 ${totalImages} 张参考图）发送到主界面进行绘图！`);
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputText.trim() || widgetLoading) return;
    widgetSendMessage(inputText, widgetImages);
    setInputText('');
    setWidgetImages([]);

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

  // 处理风格选择
  const handleStyleSelect = (style: string) => {
    const newText = inputText ? `${inputText}, ${style}` : style;
    setInputText(newText);
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  // 处理工艺选择确认
  const handleCraftsConfirm = (crafts: string[]) => {
    const craftsText = crafts.join('、');
    const newText = inputText ? `${inputText}, ${craftsText}` : craftsText;
    setInputText(newText);
    setTimeout(() => adjustTextareaHeight(), 0);
  };

  // 处理产品选择
  const handleProductSelect = (product: string) => {
    const newText = inputText ? `${inputText}, ${product}` : product;
    setInputText(newText);
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
    setInputText(e.target.value);
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
                    value={inputText}
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
                  <PromptStructureSelector onSelectStructure={handleStructureSelect} buttonText="提示词结构" />
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
    </>
  );
};