import React from 'react';
import { ChatWidget } from './components/ChatWidget';
import { ImageModal } from './components/ImageModal';

function App() {
  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* 主页面内容 */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            欢迎使用 AI 助手
          </h1>
          <p className="text-gray-600 mb-8">
            点击右下角的聊天按钮开始对话
          </p>
        </div>
      </div>
      
      {/* 聊天小部件 */}
      <ChatWidget />
      <ImageModal />
    </div>
  );
}

export default App;