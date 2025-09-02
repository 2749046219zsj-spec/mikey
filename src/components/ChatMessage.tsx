import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types/chat';
import { useImageModal } from '../hooks/useImageModal';

interface ChatMessageProps {
  message: Message;
}

// 检测文本中的图片链接
const extractImageUrls = (text: string): { text: string; images: string[] } => {
  const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
  const poeImageRegex = /(https?:\/\/pfst\.cf2\.poecdn\.net\/[^\s\)]+)/gi;
  
  const images: string[] = [];
  let cleanText = text;
  
  // 提取 Poe CDN 图片链接
  const poeMatches = text.match(poeImageRegex);
  if (poeMatches) {
    poeMatches.forEach(url => {
      if (!images.includes(url)) {
        images.push(url);
      }
    });
  }
  
  // 提取其他图片链接
  const imageMatches = text.match(imageUrlRegex);
  if (imageMatches) {
    imageMatches.forEach(url => {
      // 避免重复添加已经在 poeMatches 中的链接
      if (!images.includes(url) && !poeMatches?.includes(url)) {
        images.push(url);
      }
    });
  }
  
  // 从文本中移除所有图片链接
  images.forEach(url => {
    // 使用全局替换，确保所有重复的URL都被移除
    const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanText = cleanText.replace(new RegExp(escapedUrl, 'gi'), '');
  });
  
  // 清理文本中的 ![generated_image_1] 等标记
  cleanText = cleanText.replace(/!\[generated_image_\d+\]/g, '').trim();
  // 清理多余的括号
  cleanText = cleanText.replace(/\(\s*\)/g, '').trim();
  // 清理多余的空行
  cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim();
  // 清理开头和结尾的空白字符
  cleanText = cleanText.replace(/^\s+|\s+$/g, '');
  
  return { text: cleanText, images };
};
export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const { openModal } = useImageModal();
  const { text: cleanText, images: extractedImages } = isUser ? 
    { text: message.content, images: [] } : 
    extractImageUrls(message.content);
  
  const allImages = [...(message.images || []), ...extractedImages];

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white' 
          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
        }`}>
          {allImages && allImages.length > 0 && (
            <div className="mb-3 grid grid-cols-1 gap-2 max-w-sm">
              {allImages.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Uploaded image ${index + 1}`}
                  className="rounded-lg object-cover w-full max-h-64 border cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={() => openModal(imageUrl)}
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}
          
          {cleanText && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanText}</p>
          )}
        </div>
        
        <span className="text-xs text-gray-500 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};