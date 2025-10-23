import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Eye, EyeOff, Download, DownloadCloud, CheckSquare, Square, Upload, Heart } from 'lucide-react';
import { useImageGallery } from '../hooks/useImageGallery';
import { useImageModal } from '../hooks/useImageModal';
import { ImageWithFallback } from './ImageWithFallback';
import { ReferenceImageService } from '../services/referenceImageService';
import { GalleryService } from '../services/galleryService';
import { useAuth } from '../contexts/AuthContext';

export const ImageGallery: React.FC = () => {
  const {
    images,
    selectedIndex,
    isVisible,
    isKeyboardActive,
    checkedImages,
    selectImage,
    nextImage,
    prevImage,
    toggleVisibility,
    activateKeyboard,
    deactivateKeyboard,
    toggleImageCheck,
    selectAllImages,
    clearSelection
  } = useImageGallery();
  const { openModal } = useImageModal();
  const { user } = useAuth();
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDownloadingSelected, setIsDownloadingSelected] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());
  const [uploadSuccess, setUploadSuccess] = useState<Set<number>>(new Set());
  const [likingImages, setLikingImages] = useState<Set<number>>(new Set());
  const [likedImages, setLikedImages] = useState<Set<number>>(new Set());
  const [inGalleryImages, setInGalleryImages] = useState<Set<number>>(new Set());

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

  const downloadSelectedImages = async () => {
    if (checkedImages.size === 0 || isDownloadingSelected) return;

    setIsDownloadingSelected(true);

    try {
      const timestamp = Date.now();
      const selectedIndices = Array.from(checkedImages).sort((a, b) => a - b);

      for (let i = 0; i < selectedIndices.length; i++) {
        const imageIndex = selectedIndices[i];
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          const response = await fetch(images[imageIndex]);
          const blob = await response.blob();

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          await new Promise((resolve, reject) => {
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
                  a.download = `selected_image_${timestamp}_${imageIndex + 1}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  resolve(true);
                } else {
                  reject(new Error('Failed to create blob'));
                }
              }, 'image/jpeg', 0.9);
            };

            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = images[imageIndex];
          });
        } catch (error) {
          console.error(`Failed to download image ${imageIndex + 1}:`, error);
          const a = document.createElement('a');
          a.href = images[imageIndex];
          a.download = `selected_image_${timestamp}_${imageIndex + 1}.jpg`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }

      clearSelection();
    } finally {
      setIsDownloadingSelected(false);
    }
  };

  const downloadAllImages = async () => {
    if (images.length === 0 || isDownloadingAll) return;

    setIsDownloadingAll(true);

    try {
      const timestamp = Date.now();

      for (let i = 0; i < images.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          const response = await fetch(images[i]);
          const blob = await response.blob();

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          await new Promise((resolve, reject) => {
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
                  a.download = `gallery_image_${timestamp}_${i + 1}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  resolve(true);
                } else {
                  reject(new Error('Failed to create blob'));
                }
              }, 'image/jpeg', 0.9);
            };

            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = images[i];
          });
        } catch (error) {
          console.error(`Failed to download image ${i + 1}:`, error);
          const a = document.createElement('a');
          a.href = images[i];
          a.download = `gallery_image_${timestamp}_${i + 1}.jpg`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const uploadToPrivateLibrary = async (imageUrl: string, index: number) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    if (uploadingImages.has(index) || uploadSuccess.has(index)) {
      return;
    }

    setUploadingImages(prev => new Set(prev).add(index));

    try {
      await ReferenceImageService.saveExternalUrl(
        user.id,
        imageUrl,
        `生成图片_${Date.now()}.jpg`
      );

      setUploadSuccess(prev => new Set(prev).add(index));

      setTimeout(() => {
        setUploadSuccess(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      console.error('Upload to private library failed:', error);
      alert(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const uploadToPublicGallery = async (imageUrl: string, index: number) => {
    if (!user) {
      alert('请先登录后才能分享到画廊');
      return;
    }

    if (likingImages.has(index) || likedImages.has(index)) {
      return;
    }

    const isInGallery = await GalleryService.checkIfInGallery(imageUrl);
    if (isInGallery) {
      setInGalleryImages(prev => new Set(prev).add(index));
      setTimeout(() => {
        setInGalleryImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }, 3000);
      return;
    }

    setLikingImages(prev => new Set(prev).add(index));

    try {
      const result = await GalleryService.uploadToGallery(
        user.id,
        user.email || '匿名用户',
        imageUrl
      );

      if (result.success) {
        setLikedImages(prev => new Set(prev).add(index));

        setTimeout(() => {
          setLikedImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
        }, 3000);
      } else {
        alert(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload to gallery failed:', error);
      alert('分享到画廊失败，请重试');
    } finally {
      setLikingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Generated Images</h3>
            <span className="text-sm text-gray-500">{images.length} images</span>
          </div>

          <div className="space-y-2 mb-2">
            <button
              onClick={downloadAllImages}
              disabled={isDownloadingAll || images.length === 0}
              className="w-full px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              title="Download all images as JPG files"
            >
              {isDownloadingAll ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading {images.length} images...</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={16} />
                  <span>Download All Images</span>
                </>
              )}
            </button>

            <button
              onClick={downloadSelectedImages}
              disabled={isDownloadingSelected || checkedImages.size === 0}
              className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              title="Download selected images as JPG files"
            >
              {isDownloadingSelected ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading {checkedImages.size} images...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Selected ({checkedImages.size})</span>
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={selectAllImages}
                className="flex-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                title="Select all images"
              >
                <CheckSquare size={12} />
                <span>Select All</span>
              </button>
              <button
                onClick={clearSelection}
                disabled={checkedImages.size === 0}
                className="flex-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                title="Clear selection"
              >
                <Square size={12} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1">
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

        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 210px)' }}>
          <div className="grid grid-cols-3 gap-2">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                  selectedIndex === index
                    ? 'ring-2 ring-purple-500 shadow-lg'
                    : checkedImages.has(index)
                    ? 'ring-2 ring-blue-500 shadow-md'
                    : 'hover:shadow-md'
                }`}
                onClick={(e) => {
                  try {
                    e.stopPropagation();
                    activateKeyboard();
                    selectImage(index);
                    openModal(imageUrl);
                  } catch (error) {
                    console.error('Error opening image:', error);
                  }
                }}
                onMouseEnter={() => {
                  try {
                    if (isKeyboardActive) {
                      selectImage(index);
                    }
                  } catch (error) {
                    console.error('Error selecting image:', error);
                  }
                }}
              >
                <ImageWithFallback
                  src={imageUrl}
                  alt={`Generated image ${index + 1}`}
                  className="w-full aspect-square object-cover"
                  maxRetries={3}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />

                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImageCheck(index);
                  }}
                  className="absolute top-1 left-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center transition-opacity duration-200"
                  title={checkedImages.has(index) ? "Unselect" : "Select"}
                >
                  {checkedImages.has(index) ? (
                    <CheckSquare size={14} className="text-blue-400" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>

                {/* Action buttons */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      uploadToPublicGallery(imageUrl, index);
                    }}
                    disabled={likingImages.has(index) || likedImages.has(index) || inGalleryImages.has(index)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      likedImages.has(index)
                        ? 'bg-red-500 text-white'
                        : inGalleryImages.has(index)
                        ? 'bg-orange-500 text-white'
                        : likingImages.has(index)
                        ? 'bg-pink-500 text-white'
                        : 'bg-black/50 hover:bg-red-500 text-white'
                    } disabled:cursor-not-allowed`}
                    title={
                      likedImages.has(index)
                        ? '已分享到画廊'
                        : inGalleryImages.has(index)
                        ? '已在画廊中'
                        : '点赞并分享到画廊'
                    }
                  >
                    {likedImages.has(index) || inGalleryImages.has(index) ? (
                      <Heart size={10} className="fill-current" />
                    ) : likingImages.has(index) ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Heart size={10} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      uploadToPrivateLibrary(imageUrl, index);
                    }}
                    disabled={uploadingImages.has(index) || uploadSuccess.has(index)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      uploadSuccess.has(index)
                        ? 'bg-green-500 text-white'
                        : uploadingImages.has(index)
                        ? 'bg-blue-500 text-white'
                        : 'bg-black/50 hover:bg-black/70 text-white'
                    } disabled:cursor-not-allowed`}
                    title={uploadSuccess.has(index) ? '已保存到私有库' : '保存到私有库'}
                  >
                    {uploadSuccess.has(index) ? (
                      <CheckSquare size={10} />
                    ) : uploadingImages.has(index) ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload size={10} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(imageUrl, index);
                    }}
                    className="w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                    title="Download as JPG"
                  >
                    <Download size={10} />
                  </button>
                </div>

                {/* Image number */}
                <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/50 text-white text-xs rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
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