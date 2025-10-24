import React, { useEffect } from 'react';
import { X, Palette, Image as ImageIcon, Calendar, Sparkles } from 'lucide-react';
import { GalleryImage } from '../types/gallery';
import { ImageWithFallback } from './ImageWithFallback';

interface GalleryDetailModalProps {
  image: GalleryImage;
  currentUserId?: string;
  onClose: () => void;
  onRemake: (image: GalleryImage) => void;
  onUseAsReference: (image: GalleryImage) => void;
}

export const GalleryDetailModal: React.FC<GalleryDetailModalProps> = ({
  image,
  currentUserId,
  onClose,
  onRemake,
  onUseAsReference
}) => {
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

  const hasPrompt = image.prompt && image.prompt.trim().length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
                <ImageWithFallback
                  src={image.image_url}
                  alt={image.prompt || '画廊图片'}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="space-y-6">
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
                    onClick={() => {
                      if (!currentUserId) {
                        alert('请先登录');
                        return;
                      }
                      if (!hasPrompt) {
                        alert('该作品未公开提示词');
                        return;
                      }
                      onRemake(image);
                    }}
                    disabled={!hasPrompt}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      hasPrompt
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg hover:shadow-orange-200 active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={hasPrompt ? '使用相同提示词生成新图片' : '作者未公开提示词'}
                  >
                    <Palette size={18} />
                    <span>做同款</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!currentUserId) {
                        alert('请先登录');
                        return;
                      }
                      onUseAsReference(image);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg active:scale-95 transition-all"
                    title="以此图为参考创作新作品"
                  >
                    <ImageIcon size={18} />
                    <span>用作参考图</span>
                  </button>
                </div>
                {!hasPrompt && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    作者未公开提示词，无法使用"做同款"功能
                  </p>
                )}
              </div>

              {(image.remake_count > 0 || image.use_as_reference_count > 0) && (
                <div className="text-xs text-gray-500 text-center space-y-1">
                  {image.remake_count > 0 && (
                    <p>{image.remake_count} 人做了同款</p>
                  )}
                  {image.use_as_reference_count > 0 && (
                    <p>{image.use_as_reference_count} 人用作参考</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
