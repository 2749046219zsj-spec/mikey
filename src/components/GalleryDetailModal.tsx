import React, { useEffect, useState, useCallback } from 'react';
import { X, Palette, Image as ImageIcon, Calendar, Sparkles, Send, Upload } from 'lucide-react';
import { GalleryImage } from '../types/gallery';
import { ImageWithFallback } from './ImageWithFallback';
import ReferenceImageLibrary from './ReferenceImageLibrary';
import { useAuth } from '../contexts/AuthContext';

interface GalleryDetailModalProps {
  image: GalleryImage;
  currentUserId?: string;
  onClose: () => void;
  onSubmit: (prompt: string, images: File[]) => void;
}

export const GalleryDetailModal: React.FC<GalleryDetailModalProps> = ({
  image,
  currentUserId,
  onClose,
  onSubmit
}) => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [showReferenceLibrary, setShowReferenceLibrary] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRemake = () => {
    if (!currentUserId) {
      alert('请先登录');
      return;
    }
    setPrompt(image.prompt || '');
  };

  const handleUseAsReference = async () => {
    if (!currentUserId) {
      alert('请先登录');
      return;
    }

    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const file = new File([blob], 'reference.jpg', { type: blob.type });
      setUploadedImages(prev => [...prev, file].slice(0, 5));
    } catch (error) {
      console.error('Failed to load reference image:', error);
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

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }

    onSubmit(prompt, uploadedImages);
    onClose();
  }, [prompt, uploadedImages, onSubmit, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasPrompt = image.prompt && image.prompt.trim().length > 0;

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
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
        {/* 左侧：画廊详情 */}
        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {image.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{image.username}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(image.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square max-w-md mx-auto">
              <ImageWithFallback
                src={image.image_url}
                alt={image.prompt || '画廊图片'}
                className="w-full h-full object-contain"
              />
            </div>

            {hasPrompt && (
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-500" />
                  图片提示词
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {image.prompt}
                </p>
              </div>
            )}

            {image.model_name && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">生成信息</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">使用模型</span>
                    <span className="text-gray-900 font-medium">{image.model_name}</span>
                  </div>
                  {image.generation_params?.stylePreset && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">风格预设</span>
                      <span className="text-gray-900 font-medium">{image.generation_params.stylePreset}</span>
                    </div>
                  )}
                  {image.generation_params?.imageCount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">生成数量</span>
                      <span className="text-gray-900 font-medium">{image.generation_params.imageCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">使用这张图片</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRemake}
                  disabled={!currentUserId}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    currentUserId
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-200 active:scale-95'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={currentUserId ? '使用相同提示词生成新图片' : '请先登录'}
                >
                  <Palette size={18} />
                  <span>做同款</span>
                </button>

                <button
                  onClick={handleUseAsReference}
                  disabled={!currentUserId}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    currentUserId
                      ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg active:scale-95'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={currentUserId ? '以此图为参考创作新作品' : '请先登录'}
                >
                  <ImageIcon size={18} />
                  <span>用作参考图</span>
                </button>
              </div>
              {(image.use_as_reference_count > 0 || image.remake_count > 0) && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  {image.remake_count > 0 && `${image.remake_count} 人做了同款`}
                  {image.remake_count > 0 && image.use_as_reference_count > 0 && ' · '}
                  {image.use_as_reference_count > 0 && `${image.use_as_reference_count} 人用作参考`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：全局输入面板 */}
        <div className="lg:w-[480px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col border-l border-slate-700">
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

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReferenceLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md font-medium"
              >
                <ImageIcon size={18} />
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

            <div className="relative">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息或选择上方工具..."
                className="w-full px-4 py-3 pr-16 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                rows={4}
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

            <p className="text-sm text-gray-400 text-center">
              按 Enter 发送，Shift+Enter 换行
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
