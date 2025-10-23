import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Image as ImageIcon } from 'lucide-react';
import { GalleryImage, GallerySortBy } from '../types/gallery';
import { GalleryService } from '../services/galleryService';
import { GalleryImageCard } from './GalleryImageCard';
import { useAuth } from '../contexts/AuthContext';
import { useImageModal } from '../hooks/useImageModal';

export const PublicGallery: React.FC = () => {
  const { user } = useAuth();
  const { openModal } = useImageModal();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [sortBy, setSortBy] = useState<GallerySortBy>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadImages = async (reset: boolean = false) => {
    if (!hasMore && !reset) return;

    setIsLoading(true);
    try {
      const newPage = reset ? 0 : page;
      const newImages = await GalleryService.getGalleryImages(
        sortBy,
        20,
        newPage * 20,
        user?.id
      );

      if (newImages.length < 20) {
        setHasMore(false);
      }

      if (reset) {
        setImages(newImages);
        setPage(1);
      } else {
        setImages((prev) => [...prev, ...newImages]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load gallery images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setHasMore(true);
    loadImages(true);
  }, [sortBy, user?.id]);

  const handleScroll = () => {
    if (isLoading || !hasMore) return;

    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500;

    if (scrolledToBottom) {
      loadImages();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, page]);

  const handleLikeToggle = (imageId: string, isLiked: boolean) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              is_liked: isLiked,
              likes_count: isLiked ? img.likes_count + 1 : img.likes_count - 1,
            }
          : img
      )
    );
  };

  const handleDelete = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 rounded-full mb-4">
            <Sparkles className="text-orange-500" size={20} />
            <span className="text-sm font-medium text-gray-700">AI创意画廊</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            探索无限创意
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            发现社区用户分享的精彩AI生成作品，获取灵感，点赞你喜欢的创作
          </p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ImageIcon size={16} />
            <span>{images.length} 张作品</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                sortBy === 'latest'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Clock size={16} />
              <span className="font-medium">最新</span>
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                sortBy === 'popular'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <TrendingUp size={16} />
              <span className="font-medium">热门</span>
            </button>
          </div>
        </div>

        {images.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              画廊暂时还是空的
            </h3>
            <p className="text-gray-600">
              成为第一个分享作品的用户吧！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <GalleryImageCard
                key={image.id}
                image={image}
                currentUserId={user?.id}
                onLikeToggle={handleLikeToggle}
                onDelete={handleDelete}
                onClick={() => openModal(image.image_url)}
              />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-600">加载中...</p>
            </div>
          </div>
        )}

        {!isLoading && !hasMore && images.length > 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full">
              <Sparkles size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">已经到底啦</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
