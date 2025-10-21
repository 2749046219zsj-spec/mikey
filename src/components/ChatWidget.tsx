import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Bot, User, Send, Loader2 } from 'lucide-react';
import { useWidgetChat } from '../hooks/useWidgetChat';
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

  const { user } = useAuth();
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages: widgetMessages, isLoading: widgetLoading, sendMessage: widgetSendMessage, clearChat: widgetClearChat } = useWidgetChat();

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

  // 发送消息
  const handleSendMessage = () => {
    if (!inputText.trim() || widgetLoading) return;
    widgetSendMessage(inputText, []);
    setInputText('');

    // 重置textarea高度
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  };


  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
                    <p>你好！我是文本客服助手</p>
                    <p className="text-sm mt-1">我专注于文本咨询和问题解答</p>
                    <p className="text-xs mt-2 text-gray-400">图片生成请在主界面操作</p>
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
                <div className="flex gap-2">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    rows={1}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none overflow-y-auto"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                    disabled={widgetLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || widgetLoading}
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