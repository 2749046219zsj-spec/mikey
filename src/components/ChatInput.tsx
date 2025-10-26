import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { useImageSelector } from '../hooks/useImageSelector';

interface ChatInputProps {
  onSendMessage: (text: string, images: File[]) => void;
  isLoading: boolean;
  editContent?: { text: string; images: File[] };
  onClearEditContent?: () => void;
  isProfessionalMode?: boolean;
  professionalModeText?: string;
  onProfessionalTextChange?: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(({
  onSendMessage,
  isLoading,
  editContent,
  onClearEditContent,
  isProfessionalMode = false,
  professionalModeText = '',
  onProfessionalTextChange
}) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedImages: referenceImages, removeImageFromUnified } = useImageSelector();

  // 在专业模式下，使用外部传入的文本
  const displayText = isProfessionalMode ? professionalModeText : text;

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      setImages([...images, ...imageFiles]);
    }
  };

  // 当有编辑内容时，填充到输入框
  React.useEffect(() => {
    if (editContent) {
      // 在专业模式下，使用 onProfessionalTextChange 更新文本
      if (isProfessionalMode && onProfessionalTextChange) {
        onProfessionalTextChange(editContent.text);
      } else {
        setText(editContent.text);
      }
      setImages(editContent.images);
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }
  }, [editContent, isProfessionalMode, onProfessionalTextChange]);

  const handleSubmit = () => {
    const textToSend = isProfessionalMode ? professionalModeText : text;

    // 合并上传的图片和参考图
    const allImages = [...referenceImages, ...images];

    if ((!textToSend.trim() && allImages.length === 0) || isLoading) return;

    onSendMessage(textToSend, allImages);
    setText('');
    setImages([]);

    // 专业模式下也清空文本
    if (isProfessionalMode && onProfessionalTextChange) {
      onProfessionalTextChange('');
    }

    // 清空参考图
    for (let i = referenceImages.length - 1; i >= 0; i--) {
      removeImageFromUnified(i);
    }

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
              value={displayText}
              onChange={(e) => {
                const newValue = e.target.value;
                if (isProfessionalMode && onProfessionalTextChange) {
                  onProfessionalTextChange(newValue);
                } else {
                  setText(newValue);
                }
                adjustTextareaHeight();
              }}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder={isProfessionalMode ? "输入消息或选择上方工具..." : "Message Gemini AI..."}
              className={`w-full px-4 py-3 pr-12 rounded-2xl border focus:outline-none focus:ring-2 focus:border-transparent resize-none min-h-[48px] max-h-[120px] ${
                isProfessionalMode
                  ? 'border-orange-300 focus:ring-orange-500 bg-orange-50/50'
                  : 'border-gray-300 focus:ring-purple-500 bg-white/90'
              }`}
              disabled={isLoading}
              rows={1}
            />
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={(!displayText.trim() && images.length === 0 && referenceImages.length === 0) || isLoading}
            className={`w-12 h-12 text-white rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
              isProfessionalMode
                ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                : 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700'
            }`}
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
});