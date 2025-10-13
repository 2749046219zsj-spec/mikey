import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Bot, User, Send, Loader2, Settings, Image, Paperclip, Zap, ArrowRight } from 'lucide-react';
import { useWidgetChat } from '../hooks/useWidgetChat';
import { usePromptQueue } from '../hooks/usePromptQueue';
import { useImageSelector } from '../hooks/useImageSelector';

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
  
  const { messages: widgetMessages, isLoading: widgetLoading, sendMessage: widgetSendMessage, clearChat: widgetClearChat } = useWidgetChat();
  const { addPrompts } = usePromptQueue();
  const { openSelector } = useImageSelector();

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
    const numberedMatches = content.match(/\d+\.\s*\*\*[^*]+\*\*[^0-9]*/g);
    if (numberedMatches) {
      numberedMatches.forEach(match => {
        // 提取 ** ** 之间的内容作为提示词
        const promptMatch = match.match(/\*\*([^*]+)\*\*/);
        if (promptMatch) {
          prompts.push(promptMatch[1].trim());
        }
      });
    }
    
    // 如果没有找到编号格式，尝试其他格式
    if (prompts.length === 0) {
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.includes('**') && line.includes('**')) {
          const promptMatch = line.match(/\*\*([^*]+)\*\*/);
          if (promptMatch) {
            prompts.push(promptMatch[1].trim());
          }
        }
      });
    }
    
    return prompts.filter(prompt => prompt.length > 10); // 过滤太短的内容
  };

  // 打开图片选择器
  const handleSendPromptsToMain = (prompts: string[]) => {
    if (prompts.length === 0) return;

    openSelector(prompts, (imageFile: File) => {
      sendPromptsWithImage(prompts, imageFile);
    });
  };

  // 将提示词和图片一起发送到主界面
  const sendPromptsWithImage = (prompts: string[], imageFile: File) => {
    // 添加到队列
    addPrompts(prompts);

    // 发送第一个提示词和图片到主界面
    const mainSendMessage = (window as any).mainChatSendMessage;
    if (mainSendMessage && typeof mainSendMessage === 'function') {
      mainSendMessage(prompts[0], [imageFile]);
    }

    // 显示成功提示
    alert(`已将 ${prompts.length} 个提示词和参考图发送到主界面进行绘图！`);
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputText.trim() || widgetLoading) return;
    widgetSendMessage(inputText, widgetImages);
    setInputText('');
    setWidgetImages([]);
  };

  // 监听AI回复，自动检测提示词
  useEffect(() => {
    if (widgetMessages.length > 0) {
      const lastMessage = widgetMessages[widgetMessages.length - 1];
      if (lastMessage.type === 'ai' && !widgetLoading) {
        const prompts = extractPrompts(lastMessage.content);
        if (prompts.length >= 3) { // 至少3个提示词才显示发送按钮
          // 在消息中添加发送按钮的标记
          lastMessage.hasPrompts = true;
          lastMessage.extractedPrompts = prompts;
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
                          
                          {/* 提示词发送按钮 */}
                          {message.type === 'ai' && message.hasPrompts && message.extractedPrompts && (
                            <div className="mt-2">
                              <button
                                onClick={() => handleSendPromptsToMain(message.extractedPrompts)}
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-xs font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <Zap size={14} />
                                发送 {message.extractedPrompts.length} 个提示词到绘图
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          )}
                          
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
                  
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onPaste={handlePaste}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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