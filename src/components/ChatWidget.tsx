import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Minus, Bot, User, Send, Loader2, Settings, Image, FileText, Lightbulb, Palette } from 'lucide-react';
import { useChat } from '../hooks/useChat';

interface Position {
  x: number;
  y: number;
}

// 提示词模板
const promptTemplates = [
  {
    id: 'image-analysis',
    title: '图片分析',
    icon: Image,
    prompt: '请详细分析这张图片，包括：\n1. 图片内容描述\n2. 色彩搭配分析\n3. 构图特点\n4. 可能的用途或含义',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'content-writing',
    title: '内容创作',
    icon: FileText,
    prompt: '请帮我创作一篇关于[主题]的文章，要求：\n1. 结构清晰，逻辑性强\n2. 语言生动有趣\n3. 字数控制在800-1200字\n4. 包含实用的建议或观点',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'idea-brainstorm',
    title: '创意头脑风暴',
    icon: Lightbulb,
    prompt: '请为[项目/问题]提供创意解决方案：\n1. 至少提供5个不同角度的想法\n2. 每个想法要有具体的实施步骤\n3. 分析优缺点\n4. 推荐最佳方案',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'design-feedback',
    title: '设计反馈',
    icon: Palette,
    prompt: '请对这个设计作品提供专业反馈：\n1. 视觉效果评价\n2. 用户体验分析\n3. 改进建议\n4. 行业标准对比',
    color: 'from-purple-500 to-pink-500'
  }
];
export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [inputText, setInputText] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages: widgetMessages, isLoading: widgetLoading, sendMessage: widgetSendMessage, clearChat: widgetClearChat } = useChat();

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

  // 发送消息
  const handleSendMessage = () => {
    if (!inputText.trim() || widgetLoading) return;
    widgetSendMessage(inputText);
    setInputText('');
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

  // 使用提示词模板
  const usePromptTemplate = (template: typeof promptTemplates[0]) => {
    setInputText(template.prompt);
    setShowPrompts(false);
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
            height: isMinimized ? '60px' : '600px'
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
              {/* 提示词模板区域 */}
              <div className="border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowPrompts(!showPrompts)}
                  className="w-full p-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-orange-500" />
                    提示词模板
                  </span>
                  <span className={`transform transition-transform ${showPrompts ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {showPrompts && (
                  <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                    {promptTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => usePromptTemplate(template)}
                          className={`w-full p-2 rounded-lg text-left text-sm hover:shadow-md transition-all duration-200 bg-gradient-to-r ${template.color} text-white`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={14} />
                            <span className="font-medium">{template.title}</span>
                          </div>
                          <div className="text-xs text-white/80 line-clamp-2">
                            {template.prompt.split('\n')[0]}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* 消息区域 */}
              <div className={`flex-1 overflow-y-auto p-4 bg-gray-50 ${showPrompts ? 'h-60' : 'h-80'}`}>
                {widgetMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot size={32} className="mx-auto mb-2 text-gray-400" />
                    <p>你好！我是客服助手</p>
                    <p className="text-sm">有什么可以帮助你的吗？</p>
                    <p className="text-xs mt-2 text-gray-400">💡 试试上面的提示词模板</p>
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
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
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