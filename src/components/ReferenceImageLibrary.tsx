import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronRight, Loader2, Upload, Link as LinkIcon, HardDrive, X, Check, Trash2 } from 'lucide-react';
import { PublicReferenceImageService, ProductWithImages, PublicReferenceImage } from '../services/publicReferenceImageService';
import type { CompetitorImage } from '../services/publicReferenceImageService';
import { ReferenceImageService } from '../services/referenceImageService';
import type { ReferenceImage } from '../types/referenceImage';
import { useAuth } from '../contexts/AuthContext';
import { useReferenceImageStore } from '../stores/referenceImageStore';
import ProductSpecifications from './ProductSpecifications';

interface ReferenceImageLibraryProps {
  onBack: () => void;
  onSelectImages: (imageUrls: string[]) => void;
}

type DatabaseType = 'public' | 'private' | 'competitor';
type UploadMode = 'file' | 'url' | 'external';
type ViewMode = 'list' | 'detail' | 'upload';

export default function ReferenceImageLibrary({ onBack, onSelectImages }: ReferenceImageLibraryProps) {
  const { user } = useAuth();
  const { selectedImages, toggleImage, isImageSelected, clearImages, loadFromStorage, removeImage } = useReferenceImageStore();
  const [databaseType, setDatabaseType] = useState<DatabaseType>('public');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [publicProducts, setPublicProducts] = useState<ProductWithImages[]>([]);
  const [privateImages, setPrivateImages] = useState<ReferenceImage[]>([]);
  const [competitorImages, setCompetitorImages] = useState<CompetitorImage[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFromStorage();
    loadData();
  }, [databaseType, user, loadFromStorage]);

  useEffect(() => {
    if (viewMode === 'upload' && uploadMode === 'file') {
      const handlePaste = async (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          await handleFilesUpload(imageFiles);
        }
      };

      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [viewMode, uploadMode, user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (databaseType === 'public') {
        const products = await PublicReferenceImageService.getProductsWithImages();
        setPublicProducts(products);
      } else if (databaseType === 'competitor') {
        const images = await PublicReferenceImageService.getCompetitorImages();
        setCompetitorImages(images);
      } else {
        if (user) {
          const images = await ReferenceImageService.getUserImages(user.id);
          setPrivateImages(images);
        } else {
          setPrivateImages([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    if (!user) return;

    setUploading(true);
    setErrorMessage('');

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setErrorMessage(`${file.name} 不是图片文件`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(`${file.name} 超过 5MB 限制`);
          continue;
        }

        await ReferenceImageService.uploadReferenceImage(user.id, file);
      }
      setErrorMessage('');
      await loadData();
      alert(`成功上传 ${files.length} 张图片`);
    } catch (error: any) {
      console.error('Failed to upload images:', error);
      setErrorMessage(error.message || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    await handleFilesUpload(files);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      await handleFilesUpload(files);
    }
  };

  const handleUrlUpload = async () => {
    if (!user || !imageUrl.trim()) {
      setErrorMessage('请输入图片链接');
      return;
    }

    setUploading(true);
    setErrorMessage('');

    try {
      let newImage: ReferenceImage;

      if (uploadMode === 'url') {
        newImage = await ReferenceImageService.uploadFromUrl(user.id, imageUrl);
      } else {
        newImage = await ReferenceImageService.saveExternalUrl(user.id, imageUrl);
      }

      setImageUrl('');
      await loadData();
      alert('上传成功');
    } catch (error: any) {
      console.error('Failed to upload from URL:', error);
      setErrorMessage(error.message || 'URL 上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePrivateImage = async (image: ReferenceImage) => {
    if (!confirm(`确定要删除 ${image.file_name} 吗？`)) return;

    try {
      await ReferenceImageService.deleteReferenceImage(image.id, image.image_url);
      await loadData();
    } catch (error) {
      console.error('Failed to delete image:', error);
      setErrorMessage('删除失败，请重试');
    }
  };

  const handleDeleteCompetitorImage = async (image: CompetitorImage) => {
    if (!confirm(`确定要删除竞品图片 ${image.file_name} 吗？`)) return;

    try {
      await PublicReferenceImageService.deleteCompetitorImage(image.id);
      removeImage(image.id);
      await loadData();
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to delete competitor image:', error);
      setErrorMessage('删除失败，请重试');
    }
  };

  const handleProductClick = (product: ProductWithImages) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setViewMode('detail');
  };

  const toggleImageSelection = (image: PublicReferenceImage | ReferenceImage) => {
    const imageData = {
      id: image.id,
      url: image.image_url,
      thumbnailUrl: 'thumbnail_url' in image ? image.thumbnail_url : undefined,
      fileName: image.file_name,
      source: databaseType,
    };
    toggleImage(imageData);
  };

  const handleConfirmSelection = () => {
    if (selectedImages.length === 0) {
      alert('请选择至少一张图片');
      return;
    }
    onSelectImages(selectedImages.map(img => img.url));
    onBack();
  };

  const getCurrentImage = (): PublicReferenceImage | null => {
    if (!selectedProduct || selectedProduct.images.length === 0) return null;
    return selectedProduct.images[selectedImageIndex];
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                返回
              </button>
              <h1 className="text-2xl font-bold text-gray-900">参考图库</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  已选择 <span className="font-bold text-blue-600">{selectedImages.length}</span> 张
                </span>
                {selectedImages.length > 0 && (
                  <button
                    onClick={clearImages}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    清空
                  </button>
                )}
              </div>
              <button
                onClick={handleConfirmSelection}
                disabled={selectedImages.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                确认选择
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setDatabaseType('public');
                setViewMode('list');
                setSelectedProduct(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                databaseType === 'public'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              公共数据库
            </button>
            <button
              onClick={() => {
                setDatabaseType('competitor');
                setViewMode('list');
                setSelectedProduct(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                databaseType === 'competitor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              竞品图库
            </button>
            <button
              onClick={() => {
                setDatabaseType('private');
                setViewMode('list');
                setSelectedProduct(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                databaseType === 'private'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!user}
            >
              私有数据库
            </button>
            {databaseType === 'private' && (
              <button
                onClick={() => setViewMode('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'upload'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                上传图片
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-600 mb-2">加载失败</p>
                <p className="text-gray-600 text-sm">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  重试
                </button>
              </div>
            </div>
          ) : (
            <>
              {selectedImages.length > 0 && (
                <div className="mb-6 border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      已选择的图片 ({selectedImages.length})
                    </h3>
                    <button
                      onClick={clearImages}
                      className="text-xs text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      清空所有
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {selectedImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative group w-24 h-24 rounded-lg overflow-hidden border-2 border-green-500 shadow-md"
                      >
                        <img
                          src={image.thumbnailUrl || image.url}
                          alt={image.fileName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          ✓
                        </div>
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    这些图片将作为参考，在接下来的操作中自动保持选中状态
                  </p>
                </div>
              )}

              {databaseType === 'public' && viewMode === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicProducts.map((product) => {
                    const firstImage = product.images.length > 0 ? product.images[0] : null;
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group"
                      >
                        <div className="flex gap-4 items-start">
                          {firstImage ? (
                            <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={firstImage.thumbnail_url || firstImage.image_url}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                                {product.title}
                              </h3>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                            </div>
                            <p className="text-sm text-gray-500 mb-2">货号: {product.product_code}</p>
                            {product.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{product.images.length} 张图片</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {publicProducts.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500">
                      暂无公共参考图片
                    </div>
                  )}
                </div>
              )}

              {databaseType === 'public' && viewMode === 'detail' && selectedProduct && (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setViewMode('list');
                      setSelectedProduct(null);
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回商品列表
                  </button>

                  <div className="bg-white rounded-lg p-6 shadow-md">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedProduct.title}</h2>
                    <p className="text-sm text-gray-500 mb-4">货号: {selectedProduct.product_code}</p>
                    {selectedProduct.description && (
                      <p className="text-gray-600 mb-6">{selectedProduct.description}</p>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-700">缩略图列表</h3>

                        <ProductSpecifications productId={selectedProduct.id} />

                        {selectedProduct.images.map((image, index) => {
                          const imageSelected = isImageSelected(image.image_url);
                          return (
                            <div
                              key={image.id}
                              className="relative"
                            >
                              <div
                                onClick={() => setSelectedImageIndex(index)}
                                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImageIndex === index
                                    ? 'border-blue-600 shadow-md'
                                    : imageSelected
                                    ? 'border-green-500 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img
                                  src={image.thumbnail_url || image.image_url}
                                  alt={image.file_name}
                                  className="w-full h-24 object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleImageSelection(image);
                                }}
                                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                  imageSelected
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white border-2 border-gray-300 hover:border-green-600'
                                }`}
                              >
                                {imageSelected && <Check className="w-4 h-4" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="lg:col-span-3">
                        {getCurrentImage() && (
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                              <img
                                src={getCurrentImage()!.image_url}
                                alt={getCurrentImage()!.file_name}
                                className="w-full h-auto max-h-[600px] object-contain"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600">
                                图片 {selectedImageIndex + 1} / {selectedProduct.images.length}
                              </p>
                              <button
                                onClick={() => toggleImageSelection(getCurrentImage()!)}
                                className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                                  isImageSelected(getCurrentImage()!.image_url)
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isImageSelected(getCurrentImage()!.image_url) ? '✓ 已选择' : '选择此图片'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {databaseType === 'competitor' && viewMode === 'list' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {competitorImages.map((image) => {
                    const imageSelected = isImageSelected(image.image_url);
                    return (
                      <div
                        key={image.id}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          imageSelected
                            ? 'border-green-600 shadow-lg ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                        }`}
                      >
                        <img
                          src={image.image_url}
                          alt={image.file_name}
                          className="w-full h-48 object-cover cursor-pointer"
                          loading="lazy"
                          onClick={() => toggleImage({
                            id: image.id,
                            url: image.image_url,
                            thumbnailUrl: image.image_url,
                            fileName: image.file_name,
                            source: 'competitor',
                          })}
                        />

                        <button
                          onClick={() => toggleImage({
                            id: image.id,
                            url: image.image_url,
                            thumbnailUrl: image.image_url,
                            fileName: image.file_name,
                            source: 'competitor',
                          })}
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            imageSelected
                              ? 'bg-green-600 text-white'
                              : 'bg-white border-2 border-gray-300 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {imageSelected && <Check className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompetitorImage(image);
                          }}
                          className="absolute top-2 left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>

                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">{image.file_name}</p>
                        </div>
                      </div>
                    );
                  })}
                  {competitorImages.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500">
                      暂无竞品参考图片
                    </div>
                  )}
                </div>
              )}

              {databaseType === 'private' && viewMode === 'list' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {privateImages.map((image) => {
                    const imageSelected = isImageSelected(image.image_url);
                    return (
                      <div
                        key={image.id}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          imageSelected
                            ? 'border-green-600 shadow-lg ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                        }`}
                      >
                        <img
                          src={image.thumbnail_url || image.image_url}
                          alt={image.file_name}
                          className="w-full h-48 object-cover cursor-pointer"
                          loading="lazy"
                          onClick={() => toggleImageSelection(image)}
                        />

                        <button
                          onClick={() => toggleImageSelection(image)}
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            imageSelected
                              ? 'bg-green-600 text-white'
                              : 'bg-white border-2 border-gray-300 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {imageSelected && <Check className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrivateImage(image);
                          }}
                          className="absolute top-2 left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>

                        <div className="p-2 bg-white">
                          <p className="text-xs text-gray-600 truncate">{image.file_name}</p>
                        </div>
                      </div>
                    );
                  })}
                  {privateImages.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500">
                      {user ? '暂无私有参考图片，点击上方"上传图片"按钮添加' : '请先登录'}
                    </div>
                  )}
                </div>
              )}

              {databaseType === 'private' && viewMode === 'upload' && (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-lg p-6 shadow-md space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">上传图片到私有数据库</h2>
                      <button
                        onClick={() => setViewMode('list')}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          uploadMode === 'file'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <HardDrive className="w-4 h-4" />
                        本地上传
                      </button>
                      <button
                        onClick={() => setUploadMode('url')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          uploadMode === 'url'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <LinkIcon className="w-4 h-4" />
                        URL 上传
                      </button>
                      <button
                        onClick={() => setUploadMode('external')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          uploadMode === 'external'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <LinkIcon className="w-4 h-4" />
                        外部链接
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div
                        ref={dropZoneRef}
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileInputChange}
                          disabled={uploading}
                          className="hidden"
                        />
                        <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} />
                        <p className="text-lg font-medium text-gray-700 mb-1">
                          {uploading ? '上传中...' : '点击、拖拽图片或 Ctrl+V 粘贴'}
                        </p>
                        <p className="text-sm text-gray-500">
                          支持 JPG、PNG、GIF，单个文件最大 5MB，支持批量上传
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder={uploadMode === 'url' ? '输入图片链接（将下载到服务器）' : '输入图片链接（仅保存链接）'}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            disabled={uploading}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && imageUrl.trim()) {
                                handleUrlUpload();
                              }
                            }}
                          />
                          <button
                            onClick={handleUrlUpload}
                            disabled={!imageUrl.trim() || uploading}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                上传中
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5" />
                                {uploadMode === 'url' ? '下载并上传' : '保存链接'}
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">
                          {uploadMode === 'url'
                            ? '图片将被下载并保存到服务器'
                            : '仅保存图片链接，不下载到服务器（需确保链接长期有效）'}
                        </p>
                      </div>
                    )}

                    {errorMessage && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                        <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
