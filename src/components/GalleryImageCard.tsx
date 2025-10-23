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
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={image.image_url}
          alt={image.prompt || '画廊图片'}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          maxRetries={3}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title="删除图片"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {image.username}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(image.created_at)}
              </p>
            </div>
          </div>

          <button
            onClick={handleLike}
            disabled={!currentUserId || isLiking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
              localIsLiked
                ? 'bg-red-50 text-red-500'
                : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500'
            } ${!currentUserId ? 'opacity-50 cursor-not-allowed' : ''} ${
              isLiking ? 'scale-95' : 'hover:scale-105'
            } shadow-sm`}
            title={currentUserId ? (localIsLiked ? '取消点赞' : '点赞') : '请先登录'}
          >
            <Heart
              size={16}
              className={`transition-all duration-300 ${
                localIsLiked ? 'fill-current' : ''
              }`}
            />
            <span className="text-sm font-medium">{localLikesCount}</span>
          </button>
        </div>

        {image.prompt && (
          <p className="text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
            {image.prompt}
          </p>
        )}
      </div>
    </div>
  );
};
