import React, { useEffect, useState } from 'react';
import { GalleryImage } from '../types/gallery';
import { GalleryService } from '../services/galleryService';
import { GalleryImageCard } from './GalleryImageCard';
import { GalleryDetailModal } from './GalleryDetailModal';
import { FloatingAIPanel } from './FloatingAIPanel';
import { useAuth } from '../contexts/AuthContext';

interface GalleryCatalogGridProps {
  productType?: string;
  onSubmitGeneration?: (prompt: string, images: File[]) => void;
}

export const GalleryCatalogGrid: React.FC<GalleryCatalogGridProps> = ({
  productType,
  onSubmitGeneration,
}) => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [floatingPrompt, setFloatingPrompt] = useState<string>('');
  const [floatingImages, setFloatingImages] = useState<File[]>([]);

  useEffect(() => {
    setImages([]);
    setPage(0);
    setHasMore(true);
    loadImages(true);
  }, [productType]);

  const loadImages = async (reset: boolean = false) => {
    if (!hasMore && !reset) return;

    setLoading(true);
    try {
      const newPage = reset ? 0 : page;
      const newImages = await GalleryService.getGalleryImagesByProductType(
        productType,
        'latest',
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
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500;

      if (scrolledToBottom) {
        loadImages();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page]);

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

  const handleRemake = async (image: GalleryImage) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    await GalleryService.logGalleryUsage(image.id, user.id, 'remake');
    setFloatingPrompt(image.prompt || '');
    setShowFloatingPanel(true);
  };

  const handleUseAsReference = async (image: GalleryImage) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    await GalleryService.logGalleryUsage(image.id, user.id, 'use_as_reference');

    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const file = new File([blob], 'reference.jpg', { type: blob.type });
      setFloatingImages([file]);
      setShowFloatingPanel(true);
    } catch (error) {
      console.error('Failed to load reference image:', error);
    }
  };

  const handleFloatingPanelSubmit = async (prompt: string, images: File[]) => {
    if (onSubmitGeneration) {
      onSubmitGeneration(prompt, images);
    }
    setShowFloatingPanel(false);
    setFloatingPrompt('');
    setFloatingImages([]);
  };

  if (loading && images.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">暂无AI创意作品</p>
        <p className="text-sm mt-1">成为第一个分享作品的用户吧！</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${(index % 12) * 50}ms` }}
          >
            <GalleryImageCard
              image={image}
              currentUserId={user?.id}
              onLikeToggle={handleLikeToggle}
              onDelete={handleDelete}
              onClick={() => setSelectedImage(image)}
            />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="loader-luxury" />
            <p className="text-sm text-elegant-gray font-medium tracking-wide">加载更多...</p>
          </div>
        </div>
      )}

      {!loading && !hasMore && images.length > 0 && (
        <div className="text-center py-8">
          <span className="text-sm text-gray-500">已展示所有作品</span>
        </div>
      )}

      {selectedImage && (
        <GalleryDetailModal
          image={selectedImage}
          currentUserId={user?.id}
          onClose={() => setSelectedImage(null)}
          onRemake={handleRemake}
          onUseAsReference={handleUseAsReference}
        />
      )}

      <FloatingAIPanel
        isOpen={showFloatingPanel}
        onClose={() => {
          setShowFloatingPanel(false);
          setFloatingPrompt('');
          setFloatingImages([]);
        }}
        onSubmit={handleFloatingPanelSubmit}
        initialPrompt={floatingPrompt}
        initialImages={floatingImages}
      />
    </>
  );
};
