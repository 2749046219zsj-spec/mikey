import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Eye, EyeOff, Download } from 'lucide-react';
import { useImageGallery } from '../hooks/useImageGallery';
import { useImageModal } from '../hooks/useImageModal';

export const ImageGallery: React.FC = () => {
  const { 
    images, 
    selectedIndex, 
    isVisible,
    isKeyboardActive,
    selectImage, 
    nextImage, 
    prevImage, 
    toggleVisibility,
    activateKeyboard,
    deactivateKeyboard
  } = useImageGallery();
  const { openModal } = useImageModal();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length === 0 || !isKeyboardActive) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextImage();
          break;
        case 'Enter':
          e.preventDefault();
          if (images[selectedIndex]) {
            openModal(images[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          deactivateKeyboard();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, selectedIndex, isKeyboardActive, nextImage, prevImage, openModal, deactivateKeyboard]);

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx!.fillStyle = 'white';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gallery_image_${Date.now()}_${index + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    } catch (error) {
      console.error('Download failed:', error);
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `gallery_image_${Date.now()}_${index + 1}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (images.length === 0) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleVisibility}
        className={`fixed top-20 z-30 w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-r-lg shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200 ${
          isVisible ? 'left-80' : 'left-0'
        }`}
        title={isVisible ? 'Hide Gallery' : 'Show Gallery'}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      {/* Gallery Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg z-20 transition-transform duration-300 ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      } ${isKeyboardActive ? 'ring-2 ring-purple-500' : ''}`} 
        style={{ width: '320px' }}
        onClick={activateKeyboard}
        onMouseEnter={activateKeyboard}
        onMouseLeave={deactivateKeyboard}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Generated Images</h3>
            <span className="text-sm text-gray-500">{images.length} images</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            {isKeyboardActive ? (
              <>
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                Use ↑↓ keys to navigate, Enter to enlarge, Esc to exit
              </>
            ) : (
              'Click or hover to activate keyboard navigation'
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 80px)' }}>
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                selectedIndex === index 
                  ? 'ring-2 ring-purple-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => {
                activateKeyboard();
                selectImage(index);
                openModal(imageUrl);
              }}
              onMouseEnter={() => {
                if (isKeyboardActive) {
                  selectImage(index);
                }
              }}
            >
              <img
                src={imageUrl}
                alt={`Generated image ${index + 1}`}
                className="w-full aspect-square object-cover"
                onError={(e) => {
                  console.error('Gallery image failed to load:', imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              
              {/* Selected indicator */}
              {selectedIndex === index && (
                <div className="absolute top-2 left-2 w-3 h-3 bg-purple-500 rounded-full border-2 border-white" />
              )}
              
              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(imageUrl, index);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Download as JPG"
              >
                <Download size={14} />
              </button>
              
              {/* Image number */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation hints */}
        {images.length > 1 && isKeyboardActive && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded">
              <ChevronLeft size={12} />
              <span>↑</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded">
              <ChevronRight size={12} />
              <span>↓</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded">
              <span>Esc</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};