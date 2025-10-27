import React, { useState } from 'react';
import { Heart, User, Trash2 } from 'lucide-react';
import { GalleryImage } from '../types/gallery';
import { ImageWithFallback } from './ImageWithFallback';
import { GalleryService } from '../services/galleryService';

interface GalleryImageCardProps {
  image: GalleryImage;
  currentUserId?: string;
  onLikeToggle?: (imageId: string, isLiked: boolean) => void;
  onDelete?: (imageId: string) => void;
  onClick?: () => void;
}

export const GalleryImageCard: React.FC<GalleryImageCardProps> = ({
  image,
  currentUserId,
  onLikeToggle,
  onDelete,
  onClick,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState(image.is_liked || false);
  const [localLikesCount, setLocalLikesCount] = useState(image.likes_count);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === image.user_id;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    const previousState = localIsLiked;
    const previousCount = localLikesCount;

    setLocalIsLiked(!localIsLiked);
    setLocalLikesCount(localIsLiked ? localLikesCount - 1 : localLikesCount + 1);

    try {
      const result = await GalleryService.toggleLike(image.id, currentUserId);

      if (result.success) {
        onLikeToggle?.(image.id, result.isLiked);
      } else {
        setLocalIsLiked(previousState);
        setLocalLikesCount(previousCount);
      }
    } catch (error) {
      setLocalIsLiked(previousState);
      setLocalLikesCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUserId || !isOwner || isDeleting) return;

    if (!confirm('确定要删除这张图片吗？')) return;

    setIsDeleting(true);
    try {
      const result = await GalleryService.deleteGalleryImage(image.id, currentUserId);

      if (result.success) {
        onDelete?.(image.id);
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}天前`;

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="gallery-item group w-full"
    >
      {/* 图片容器 - 保持原始比例 */}
      <div className="relative overflow-hidden bg-white">
        <ImageWithFallback
          src={image.image_url}
          alt={image.prompt || '画廊图片'}
          className="w-full h-auto object-contain"
          maxRetries={3}
        />

        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

        {/* 删除按钮 - 优雅设计 */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-hermes-orange text-elegant-charcoal hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-luxury-md"
            title="删除图片"
          >
            {isDeleting ? (
              <div className="loader-luxury w-4 h-4" style={{ border: '2px solid', borderTopColor: 'transparent' }} />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        )}

        {/* 悬停时显示的用户信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-gradient-sunset rounded-full flex items-center justify-center flex-shrink-0 shadow-luxury-md">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate drop-shadow-lg">
                {image.username}
              </p>
              <p className="text-xs opacity-90 drop-shadow-lg">
                {formatDate(image.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部信息卡片 */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-luxury-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400 border border-elegant-sand/30">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleLike}
            disabled={!currentUserId || isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
              localIsLiked
                ? 'bg-gradient-sunset text-white shadow-luxury-md'
                : 'bg-elegant-cream text-elegant-charcoal hover:bg-hermes-coral hover:text-white'
            } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''} ${
              isLiking ? 'scale-95' : 'hover:scale-105'
            }`}
            title={currentUserId ? (localIsLiked ? '取消点赞' : '点赞') : '请先登录'}
          >
            <Heart
              size={16}
              className={`transition-all duration-300 ${
                localIsLiked ? 'fill-current' : ''
              }`}
            />
            <span className="text-sm font-semibold">{localLikesCount}</span>
          </button>
        </div>

        {image.prompt && (
          <p className="text-xs text-elegant-gray line-clamp-2 leading-relaxed font-light">
            {image.prompt}
          </p>
        )}
      </div>
    </div>
  );
};
