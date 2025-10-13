import React, { useState } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ChatHeader } from './components/ChatHeader';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { useChat } from './hooks/useChat';

function App() {
  const { 
    messages, 
    isLoading, 
    error, 
    selectedModel, 
    sendMessage, 
    retryToInput, 
    clearChat, 
    setSelectedModel 
  } = useChat();

  const [editContent, setEditContent] = useState<{ text: string; images: File[] } | null>(null);

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
    </div>
  );
}

export default App;