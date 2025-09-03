import React from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ImageModal } from './components/ImageModal';
import { useChat } from './hooks/useChat';

function App() {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    retryLastMessage, 
    editAndResend, 
    clearChat 
  } = useChat();
  
  const [editContent, setEditContent] = React.useState<{ text: string; images: File[] } | null>(null);

  const handleSetEditContent = (text: string, images: File[]) => {
    setEditContent({ text, images });
  };

  const handleClearEditContent = () => {
    setEditContent(null);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      <ChatHeader 
        onClearChat={clearChat}
        messageCount={messages.length}
      />
      
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        error={error}
        onRetry={retryLastMessage}
        onEditAndResend={editAndResend}
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
      
      <ImageModal />
    </div>
  );
}

export default App;