import React from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ImageModal } from './components/ImageModal';
import { ImageGallery } from './components/ImageGallery';
import { useChat } from './hooks/useChat';
import { useImageGallery } from './hooks/useImageGallery';

function App() {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    retryToInput, 
    clearChat 
  } = useChat();
  
  const { clearImages } = useImageGallery();
  const [editContent, setEditContent] = React.useState<{ text: string; images: File[] } | null>(null);

  const handleSetEditContent = (text: string, images: File[]) => {
    setEditContent({ text, images });
  };

  const handleClearEditContent = () => {
    setEditContent(null);
  };

  const handleClearChat = () => {
    clearChat();
    clearImages();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      <ImageGallery />
      
      <ChatHeader 
        onClearChat={handleClearChat}
        messageCount={messages.length}
      />
      
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <ChatContainer 
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRetryToInput={retryToInput}
            onSetEditContent={handleSetEditContent}
          />
          
          <div className="flex-shrink-0">
            <ChatInput 
              onSendMessage={sendMessage}
              isLoading={isLoading}
              editContent={editContent}
              onClearEditContent={handleClearEditContent}
            />
          </div>
        </div>
      </div>
      
      <ImageModal />
    </div>
  );
}

export default App;