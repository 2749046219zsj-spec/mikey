import React, { useState, useEffect } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { ChatWidget } from './components/ChatWidget';
import { useChat } from './hooks/useChat';

function App() {
  const { 
    messages, 
    isLoading, 
    error, 
    selectedModel, 
    queueInfo,
    sendMessage, 
    retryToInput, 
    clearChat, 
    setSelectedModel 
  } = useChat();

  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);

  // 将发送消息函数暴露给全局，供客服弹窗调用
  useEffect(() => {
    (window as any).mainChatSendMessage = sendMessage;
    return () => {
      delete (window as any).mainChatSendMessage;
    };
  }, [sendMessage]);
  const handleSendMessage = (text: string, images: File[]) => {
    sendMessage(text, images);
    setEditContent(null);
  };

  const handleSetEditContent = (text: string, images: File[]) => {
    setEditContent({ text, images });
  };

  const handleClearEditContent = () => {
    setEditContent(null);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col">
      <ChatHeader 
        onClearChat={clearChat}
        messageCount={messages.length}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        isLoading={isLoading}
        queueInfo={queueInfo}
      />
      
      <ChatContainer 
        messages={messages}
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
      />
      
      <ImageModal />
      <ImageGallery />
      
      {/* 客服弹窗 */}
      <ChatWidget />
    </div>
  );
}

export default App;