import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useImageModal } from '../hooks/useImageModal';
import { useImageGallery } from '../hooks/useImageGallery';

export const ImageModal: React.FC = () => {
  const { isOpen, imageUrl, closeModal } = useImageModal();
  const { images, selectedIndex, nextImage, prevImage, selectImage } = useImageGallery();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeModal, nextImage, prevImage]);

  // 当选中的图片改变时，更新模态框显示的图片
  const currentImageUrl = images[selectedIndex] || imageUrl;
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={closeModal}
    >
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center">
        {/* 左箭头 */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-10"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        {/* 右箭头 */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-10"
          >
            <ChevronRight size={24} />
          </button>
        )}
        
        <button
          onClick={closeModal}
          className="absolute -top-12 right-0 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors duration-200"
        >
          <X size={20} />
        </button>
        
        <img
          src={currentImageUrl}
          alt="Enlarged view"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* 图片计数器 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};