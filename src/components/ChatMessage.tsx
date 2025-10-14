import React from 'react';
import { Bot, User, RotateCcw, CreditCard as Edit3, Download } from 'lucide-react';
import { Message } from '../types/chat';
import { useImageModal } from '../hooks/useImageModal';
import { useImageGallery } from '../hooks/useImageGallery';

interface ChatMessageProps {
  message: Message;
  onRetryToInput?: (messageId: string, onEdit: (text: string, images: File[]) => void) => void;
  onSetEditContent?: (text: string, images: File[]) => void;
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
export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onRetryToInput, onSetEditContent }) => {
  const isUser = message.type === 'user';
  const { openModal } = useImageModal();
  const { addImages } = useImageGallery();
  
  const { text: cleanText, images: extractedImages } = React.useMemo(() => {
    return isUser ? 
      { text: message.content, images: [] } : 
      extractImageUrls(message.content);
  }, [isUser, message.content]);
  
  const allImages = [...(message.images || []), ...extractedImages];
  
  // Add AI generated images to gallery
  React.useEffect(() => {
    if (!isUser && extractedImages.length > 0) {
      // 使用 setTimeout 来避免在渲染过程中更新状态
      const timeoutId = setTimeout(() => {
        addImages(extractedImages);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isUser, extractedImages, addImages]);
  
  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a canvas to convert to JPG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Fill white background for JPG
        ctx!.fillStyle = 'white';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image
        ctx!.drawImage(img, 0, 0);
        
        // Convert to JPG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image_${Date.now()}_${index + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: direct download
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `image_${Date.now()}_${index + 1}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleRetryToInput = () => {
    if (onRetryToInput && onSetEditContent) {
      onRetryToInput(message.id, onSetEditContent);
    }
  };

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
            : message.hasError ? 'bg-red-50 border border-red-200 text-red-800 shadow-sm' : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
        }`}>
          {allImages && allImages.length > 0 && (
            <div className="mb-3 grid grid-cols-1 gap-2 max-w-sm">
              {allImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <img
                    src={imageUrl}
                    alt={`Uploaded image ${index + 1}`}
                    className="rounded-lg object-cover w-full max-h-64 border cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    onClick={() => openModal(imageUrl)}
                    onError={(e) => {
                      console.error('Image failed to load:', imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {!isUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(imageUrl, index);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Download as JPG"
                    >
                      <Download size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {cleanText && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanText}</p>
          )}
          
          {message.hasError && (
            <div className="mt-3 pt-3 border-t border-red-200 flex gap-2">
              <button
                onClick={handleRetryToInput}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors duration-200"
              >
                <Edit3 size={12} />
                重新发送
              </button>
            </div>
          )}
          
          {/* 显示使用的模型 */}
          {message.model && !isUser && (
            <div className="mt-2 text-xs text-gray-500">
              Generated by Gemini 2.5 Flash
            </div>
          )}
        </div>
        
        {/* 为用户消息添加重新发送按钮 */}
        {isUser && (
          <button
            onClick={handleRetryToInput}
            className="mt-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center gap-1"
          >
            <RotateCcw size={12} />
            重新发送
          </button>
        )}
        
        <span className="text-xs text-gray-500 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};