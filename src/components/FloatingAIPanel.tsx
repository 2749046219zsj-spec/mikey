import React, { useState, useCallback, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Upload, Minimize2, Maximize2 } from 'lucide-react';
import ReferenceImageLibrary from './ReferenceImageLibrary';
import { useAuth } from '../contexts/AuthContext';

interface FloatingAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, images: File[]) => void;
  initialPrompt?: string;
  initialImages?: File[];
}

export const FloatingAIPanel: React.FC<FloatingAIPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPrompt,
  initialImages
}) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialImages) {
      setUploadedImages(prev => [...prev, ...initialImages].slice(0, 5));
    }
  }, [initialImages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setUploadedImages(prev => [...prev, ...files].slice(0, 5));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      setUploadedImages(prev => [...prev, ...files].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReferenceLibrarySelect = (selectedImageUrls: string[]) => {
    Promise.all(
      selectedImageUrls.map(url =>
        fetch(url)
          .then(res => res.blob())
          .then(blob => new File([blob], `reference-${Date.now()}.jpg`, { type: blob.type }))
      )
    ).then(files => {
      setUploadedImages(prev => [...prev, ...files].slice(0, 5));
    }).catch(console.error);

    setShowReferenceLibrary(false);
  };

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }

    onSubmit(prompt, uploadedImages);
    setPrompt('');
    setUploadedImages([]);
  }, [prompt, uploadedImages, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  if (showReferenceLibrary && user) {
    return (
      <ReferenceImageLibrary
        userId={user.id}
        onBack={() => setShowReferenceLibrary(false)}
        onSelectImages={handleReferenceLibrarySelect}
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] animate-slide-up">
      <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 transition-all ${
        isMinimized ? 'w-80' : 'w-96'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">AI 图片生成配置</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors"
              aria-label={isMinimized ? '展开' : '收起'}
            >
              {isMinimized ? (
                <Maximize2 size={16} className="text-gray-400" />
              ) : (
                <Minimize2 size={16} className="text-gray-400" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors"
              aria-label="关闭"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReferenceLibrary(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md font-medium"
              >
                <ImageIcon size={16} />
                <span>参考图库</span>
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl transition-all ${
                isDragging
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-600 bg-slate-800/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadedImages.length > 0 ? (
                <div className="p-3">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`上传 ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {uploadedImages.length < 5 && (
                    <label className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-gray-300 cursor-pointer">
                      <Upload size={14} />
                      <span>继续添加 (最多5张)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-2">
                    <Upload size={20} className="text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Click, drag or Ctrl+V
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息或选择上方工具..."
                className="w-full px-3 py-2 pr-12 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl text-white text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                rows={3}
              />

              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="absolute right-2 bottom-2 w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="发送"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              按 Enter 发送，Shift+Enter 换行
            </p>
          </div>
        )}

        {isMinimized && (
          <div className="p-4">
            <p className="text-sm text-gray-400 text-center">
              点击展开以配置生成参数
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
