import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface ChatInputProps {
  onSendMessage: (text: string, images: File[]) => void;
  isLoading: boolean;
  editContent?: { text: string; images: File[] };
  onClearEditContent?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  editContent, 
  onClearEditContent 
}) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 当有编辑内容时，填充到输入框
  React.useEffect(() => {
    if (editContent) {
      setText(editContent.text);
      setImages(editContent.images);
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }
  }, [editContent]);

  const handleSubmit = () => {
    if ((!text.trim() && images.length === 0) || isLoading) return;
    
    onSendMessage(text, images);
    setText('');
    setImages([]);
    onClearEditContent?.();
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        {editContent && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">正在编辑消息</span>
              <button
                onClick={onClearEditContent}
                className="text-blue-500 hover:text-blue-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        <ImageUpload images={images} onImagesChange={setImages} />
        
        <div className="flex gap-3 items-end mt-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Gemini AI..."
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[48px] max-h-[120px] bg-white/90"
              disabled={isLoading}
              rows={1}
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && images.length === 0) || isLoading}
            className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full flex items-center justify-center hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};