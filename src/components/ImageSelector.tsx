import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, ImageIcon, Upload, Clipboard, Trash2, ChevronRight, Database, User } from 'lucide-react';
import { useImageSelector } from '../hooks/useImageSelector';
import { useImageGallery } from '../hooks/useImageGallery';
import { ReferenceImageService } from '../services/referenceImageService';
import { PublicReferenceImageService, type ProductWithImages } from '../services/publicReferenceImageService';
import type { ReferenceImage } from '../types/referenceImage';
import { useAuth } from '../contexts/AuthContext';

export const ImageSelector: React.FC = () => {
  const {
    isOpen,
    prompts,
    mode,
    selectedImageUrl,
    selectedImageFile,
    selectedImages,
    promptImages,
    currentPromptIndex,
    onConfirm,
    onConfirmMultiple,
    closeSelector,
    selectImage,
    selectUploadedImage,
    setMode,
    addImageToUnified,
    removeImageFromUnified,
    addImageToPrompt,
    removeImageFromPrompt,
    setCurrentPromptIndex
  } = useImageSelector();

  const { user } = useAuth();
  const { images } = useImageGallery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dbImages, setDbImages] = useState<ReferenceImage[]>([]);
  const [loadingDbImages, setLoadingDbImages] = useState(false);
  const [databaseTab, setDatabaseTab] = useState<'private' | 'public'>('public');
  const [publicProducts, setPublicProducts] = useState<ProductWithImages[]>([]);
  const [loadingPublicProducts, setLoadingPublicProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const isAdvancedMode = onConfirmMultiple !== null;

  useEffect(() => {
    const loadDbImages = async () => {
      if (isOpen && databaseTab === 'private') {
        console.log('ImageSelector opened, loading private database images...');
        console.log('User:', user);
        setLoadingDbImages(true);
        try {
          if (user) {
            const images = await ReferenceImageService.getUserImages(user.id);
            console.log('Loaded database images for user:', images.length, 'images');
            console.log('Images:', images);
            setDbImages(images);
          } else {
            console.log('No user logged in, attempting to load all images...');
            const images = await ReferenceImageService.getAllImages();
            console.log('Loaded all database images (no user):', images.length, 'images');
            setDbImages(images);
          }
        } catch (error) {
          console.error('Failed to load database images:', error);
          setDbImages([]);
        } finally {
          setLoadingDbImages(false);
        }
      } else {
        setDbImages([]);
      }
    };

    loadDbImages();
  }, [isOpen, user, databaseTab]);

  useEffect(() => {
    const loadPublicProducts = async () => {
      if (isOpen && databaseTab === 'public') {
        console.log('Loading public products...');
        setLoadingPublicProducts(true);
        try {
          const products = await PublicReferenceImageService.getProductsWithImages();
          console.log('Loaded public products:', products.length);
          setPublicProducts(products);
        } catch (error) {
          console.error('Failed to load public products:', error);
          setPublicProducts([]);
        } finally {
          setLoadingPublicProducts(false);
        }
      } else {
        setPublicProducts([]);
        setSelectedProductId(null);
      }
    };

    loadPublicProducts();
  }, [isOpen, databaseTab]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSelector();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeSelector]);

  const handleConfirm = async () => {
    if (isAdvancedMode && onConfirmMultiple) {
      if (mode === 'unified') {
        if (selectedImages.length === 0) {
          alert('请至少选择一张参考图');
          return;
        }
        onConfirmMultiple({
          mode: 'unified',
          unifiedImages: selectedImages
        });
      } else {
        const result = prompts.map((prompt, index) => ({
          prompt,
          images: promptImages.get(index) || []
        }));
        onConfirmMultiple({
          mode: 'individual',
          promptImages: result
        });
      }
      closeSelector();
    } else if (onConfirm) {
      if (selectedImageFile) {
        onConfirm(selectedImageFile);
        closeSelector();
      } else if (selectedImageUrl) {
        try {
          const response = await fetch(selectedImageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'reference_image.jpg', { type: blob.type });
          onConfirm(file);
          closeSelector();
        } catch (error) {
          console.error('Failed to convert image:', error);
          alert('图片加载失败，请重试');
        }
      }
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (isAdvancedMode) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

      if (mode === 'unified') {
        imageFiles.forEach(file => addImageToUnified(file));
      } else {
        imageFiles.forEach(file => addImageToPrompt(currentPromptIndex, file));
      }
    } else {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        selectUploadedImage(file);
      } else {
        alert('请选择图片文件');
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          if (isAdvancedMode) {
            if (mode === 'unified') {
              addImageToUnified(file);
            } else {
              addImageToPrompt(currentPromptIndex, file);
            }
          } else {
            selectUploadedImage(file);
          }
          return;
        }
      }
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

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleGalleryImageClick = async (imageUrl: string) => {
    if (isAdvancedMode) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `gallery_image_${Date.now()}.jpg`, { type: blob.type });

        if (mode === 'unified') {
          addImageToUnified(file);
        } else {
          addImageToPrompt(currentPromptIndex, file);
        }
      } catch (error) {
        console.error('Failed to convert gallery image:', error);
        alert('图片加载失败，请重试');
      }
    } else {
      selectImage(imageUrl);
    }
  };

  if (!isOpen) return null;

  const currentPromptImages = promptImages.get(currentPromptIndex) || [];

  console.log('ImageSelector rendering, dbImages count:', dbImages.length);
  console.log('loadingDbImages:', loadingDbImages);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">选择参考图</h2>
            <p className="text-sm text-gray-500 mt-1">
              将发送 <span className="font-medium text-blue-600">{prompts.length}</span> 个提示词到主界面
              {isAdvancedMode && '，请选择参考图模式'}
            </p>
          </div>
          <button
            onClick={closeSelector}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isAdvancedMode && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => setMode('unified')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  mode === 'unified'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-sm">统一参考图</div>
                <div className="text-xs opacity-80 mt-1">
                  所有提示词共用同一组参考图
                </div>
              </button>
              <button
                onClick={() => setMode('individual')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  mode === 'individual'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-sm">独立参考图</div>
                <div className="text-xs opacity-80 mt-1">
                  每个提示词配置独立的参考图
                </div>
              </button>
            </div>
          </div>
        )}

        {isAdvancedMode && mode === 'individual' && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">选择提示词</div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {prompts.map((prompt, index) => {
                const imageCount = (promptImages.get(index) || []).length;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentPromptIndex(index)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPromptIndex === index
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {prompt.slice(0, 20)}
                    {prompt.length > 20 ? '...' : ''}
                    {imageCount > 0 && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                        currentPromptIndex === index
                          ? 'bg-white/20'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {imageCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6" onPaste={handlePaste} tabIndex={0}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={isAdvancedMode}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          <div
            ref={uploadAreaRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mb-6 border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex gap-4 mb-3">
                <Upload size={32} className="text-gray-400" />
                <Clipboard size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                上传本地图片或粘贴复制的图片
              </p>
              <p className="text-xs text-gray-500">
                点击上传、拖拽图片到此处，或使用 Ctrl+V 粘贴
                {isAdvancedMode && ' (支持多选)'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                选择文件
              </button>
            </div>
          </div>

          {isAdvancedMode && mode === 'unified' && selectedImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                已选择的图片 ({selectedImages.length})
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden ring-2 ring-green-500 shadow-md">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <button
                      onClick={() => removeImageFromUnified(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdvancedMode && mode === 'individual' && currentPromptImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                当前提示词的参考图 ({currentPromptImages.length})
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {currentPromptImages.map((file, index) => (
                  <div key={index} className="relative group rounded-lg overflow-hidden ring-2 ring-green-500 shadow-md">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Image ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <button
                      onClick={() => removeImageFromPrompt(currentPromptIndex, index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isAdvancedMode && selectedImageUrl && selectedImageFile && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">已选择的图片</h3>
              <div className="relative group w-48 rounded-lg overflow-hidden ring-4 ring-green-500 shadow-lg">
                <img
                  src={selectedImageUrl}
                  alt="Selected"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={24} className="text-green-600 bg-white rounded-full" />
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                  已上传
                </div>
              </div>
            </div>
          )}

          {databaseTab === 'private' && loadingDbImages && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">从私有数据库选择参考图</h3>
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">加载中...</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDatabaseTab('public')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  databaseTab === 'public'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Database size={18} />
                公共数据库
              </button>
              <button
                onClick={() => setDatabaseTab('private')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  databaseTab === 'private'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <User size={18} />
                私有数据库
              </button>
            </div>

            {databaseTab === 'public' && loadingPublicProducts && (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">加载中...</p>
              </div>
            )}

            {databaseTab === 'public' && !loadingPublicProducts && publicProducts.length === 0 && (
              <div className="text-center text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <ImageIcon size={32} className="mx-auto mb-2" />
                <p className="text-sm">暂无公共参考图</p>
              </div>
            )}

            {databaseTab === 'public' && !loadingPublicProducts && publicProducts.length > 0 && !selectedProductId && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  选择产品 (共 {publicProducts.length} 个)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {publicProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className="flex items-start gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all text-left"
                    >
                      {product.images.length > 0 && (
                        <img
                          src={product.images[0].thumbnail_url || product.images[0].image_url}
                          alt={product.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-800 truncate">{product.title}</h4>
                          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500 mb-1">货号: {product.product_code}</p>
                        {product.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                        )}
                        <p className="text-xs text-blue-600 mt-2">{product.images.length} 张图片</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {databaseTab === 'public' && !loadingPublicProducts && selectedProductId && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setSelectedProductId(null)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    ← 返回
                  </button>
                  <span className="text-sm text-gray-500">
                    {publicProducts.find(p => p.id === selectedProductId)?.title}
                  </span>
                </div>
                {(() => {
                  const selectedProduct = publicProducts.find(p => p.id === selectedProductId);
                  if (!selectedProduct || selectedProduct.images.length === 0) {
                    return (
                      <div className="text-center text-gray-400 py-6">
                        <p className="text-sm">该产品暂无图片</p>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        已选择 {selectedProduct.images.filter(img => {
                          if (isAdvancedMode) {
                            if (mode === 'unified') {
                              return selectedImages.some(file => file.name.includes(img.image_url));
                            } else {
                              return currentPromptImages.some(file => file.name.includes(img.image_url));
                            }
                          }
                          return selectedImageUrl === img.image_url && !selectedImageFile;
                        }).length} / {selectedProduct.images.length} 张
                      </h3>
                      <div className="grid grid-cols-5 gap-3">
                        {selectedProduct.images.map((img, index) => {
                          let isSelected = false;
                          if (isAdvancedMode) {
                            if (mode === 'unified') {
                              isSelected = selectedImages.some(file => file.name.includes(img.image_url));
                            } else {
                              isSelected = currentPromptImages.some(file => file.name.includes(img.image_url));
                            }
                          } else {
                            isSelected = selectedImageUrl === img.image_url && !selectedImageFile;
                          }

                          return (
                            <div
                              key={img.id}
                              onClick={() => handleGalleryImageClick(img.image_url)}
                              className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                                isSelected
                                  ? 'ring-4 ring-green-500 shadow-lg scale-105'
                                  : 'hover:ring-2 hover:ring-gray-300 hover:shadow-md'
                              }`}
                            >
                              <img
                                src={img.thumbnail_url || img.image_url}
                                alt={`图片 ${index + 1}`}
                                className="w-full aspect-square object-cover"
                                loading="lazy"
                              />
                              <div className={`absolute inset-0 transition-all duration-200 ${
                                isSelected
                                  ? 'bg-green-500/20'
                                  : 'bg-black/0 group-hover:bg-black/10'
                              }`} />
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle2 size={24} className="text-green-600 bg-white rounded-full" />
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                                图片 {index + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {databaseTab === 'private' && !loadingDbImages && dbImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                从私有数据库选择参考图
                {(() => {
                  let selectedCount = 0;
                  dbImages.forEach((dbImage) => {
                    let isSelected = false;
                    if (isAdvancedMode) {
                      if (mode === 'unified') {
                        isSelected = selectedImages.some(file => file.name.includes(dbImage.image_url));
                      } else {
                        isSelected = currentPromptImages.some(file => file.name.includes(dbImage.image_url));
                      }
                    } else {
                      isSelected = selectedImageUrl === dbImage.image_url && !selectedImageFile;
                    }
                    if (isSelected) selectedCount++;
                  });
                  return selectedCount > 0 ? ` (已选 ${selectedCount}/${dbImages.length})` : ` (共 ${dbImages.length} 张)`;
                })()}
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {dbImages.map((dbImage, index) => {
                  // Check if image is selected (works for both modes)
                  let isSelected = false;
                  if (isAdvancedMode) {
                    if (mode === 'unified') {
                      isSelected = selectedImages.some(file => file.name.includes(dbImage.image_url));
                    } else {
                      isSelected = currentPromptImages.some(file => file.name.includes(dbImage.image_url));
                    }
                  } else {
                    isSelected = selectedImageUrl === dbImage.image_url && !selectedImageFile;
                  }

                  return (
                    <div
                      key={dbImage.id}
                      onClick={() => handleGalleryImageClick(dbImage.image_url)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        isSelected
                          ? 'ring-4 ring-green-500 shadow-lg scale-105'
                          : 'hover:ring-2 hover:ring-gray-300 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={dbImage.image_url}
                        alt={dbImage.title || `Database Image ${index + 1}`}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />

                      <div className={`absolute inset-0 transition-all duration-200 ${
                        isSelected
                          ? 'bg-green-500/20'
                          : 'bg-black/0 group-hover:bg-black/10'
                      }`} />

                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 size={24} className="text-green-600 bg-white rounded-full" />
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded truncate max-w-[calc(100%-1rem)]">
                        {dbImage.title || `图片 ${index + 1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {databaseTab === 'private' && !loadingDbImages && dbImages.length === 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">从私有数据库选择参考图</h3>
              <div className="text-center text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <ImageIcon size={32} className="mx-auto mb-2" />
                <p className="text-sm">暂无私有参考图</p>
                <p className="text-xs mt-1">请前往"参考图预设"上传图片</p>
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">或从历史图库选择</h3>
              <div className="grid grid-cols-5 gap-3">
                {images.map((imageUrl, index) => {
                  const isSelected = !isAdvancedMode && selectedImageUrl === imageUrl && !selectedImageFile;
                  return (
                    <div
                      key={index}
                      onClick={() => handleGalleryImageClick(imageUrl)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        isSelected
                          ? 'ring-4 ring-blue-500 shadow-lg scale-105'
                          : 'hover:ring-2 hover:ring-gray-300 hover:shadow-md'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />

                      <div className={`absolute inset-0 transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-500/20'
                          : 'bg-black/0 group-hover:bg-black/10'
                      }`} />

                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 size={24} className="text-blue-600 bg-white rounded-full" />
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                        #{index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {isAdvancedMode && mode === 'unified' && (
              <span>已选择 {selectedImages.length} 张参考图</span>
            )}
            {isAdvancedMode && mode === 'individual' && (
              <span>
                已为 {Array.from(promptImages.keys()).filter(k => (promptImages.get(k) || []).length > 0).length} / {prompts.length} 个提示词配置参考图
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={closeSelector}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                isAdvancedMode
                  ? (mode === 'unified' && selectedImages.length === 0)
                  : !selectedImageUrl
              }
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:hover:shadow-md"
            >
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
