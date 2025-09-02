import React from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatContainer } from './components/ChatContainer';
import { ChatInput } from './components/ChatInput';
import { ImageModal } from './components/ImageModal';
import { useChat } from './hooks/useChat';

function App() {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat();

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
      />
      
      <div className="flex-shrink-0">
        <ChatInput 
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
      
      <ImageModal />
    </div>
  );
}

export default App;