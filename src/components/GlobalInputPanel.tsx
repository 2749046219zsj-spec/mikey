import React, { useState, useCallback, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Upload } from 'lucide-react';
import ReferenceImageLibrary from './ReferenceImageLibrary';
import { useAuth } from '../contexts/AuthContext';

interface GlobalInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: GenerationParams) => void;
  initialPrompt?: string;
  initialStyle?: string;
  initialReferenceImageUrl?: string;
}

export interface GenerationParams {
  prompt: string;
  uploadedImages: File[];
}

export const GlobalInputPanel: React.FC<GlobalInputPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPrompt,
  initialStyle,
  initialReferenceImageUrl
}) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt || '');

      if (initialReferenceImageUrl) {
        fetch(initialReferenceImageUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'reference.jpg', { type: blob.type });
            setUploadedImages([file]);
          })
          .catch(console.error);
      }
    }
  }, [isOpen, initialPrompt, initialStyle, initialReferenceImageUrl]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }

    onSubmit({
      prompt,
      uploadedImages
    });

    setPrompt('');
    setUploadedImages([]);
    onClose();
  }, [prompt, uploadedImages, onSubmit, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

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
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[100] animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
        <div
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">AI 图片生成配置</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors"
              aria-label="关闭"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              <button
                onClick={() => setShowReferenceLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md font-medium"
              >
                <ImageIcon size={18} />
                <span>参考图库</span>
              </button>
            </div>

            <div
              className={`animate-fade-in-up border-2 border-dashed rounded-xl transition-all ${
                isDragging
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-600 bg-slate-800/30'
              }`}
              style={{ animationDelay: '0.1s' }}
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
                          className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {uploadedImages.length < 5 && (
                    <label className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-300 cursor-pointer">
                      <Upload size={16} />
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
                <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-3">
                    <Upload size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">
                    Click, drag images or Ctrl+V to paste
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

            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息或选择上方工具..."
                className="w-full px-4 py-3 pr-16 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                rows={3}
              />

              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="absolute right-3 bottom-3 w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="发送"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>

            <p className="text-sm text-gray-400 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              按 Enter 发送，Shift+Enter 换行
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
