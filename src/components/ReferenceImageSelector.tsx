import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { PublicReferenceImageService, ProductWithImages, PublicReferenceImage } from '../services/publicReferenceImageService';
import { ReferenceImageService } from '../services/referenceImageService';
import type { ReferenceImage } from '../types/referenceImage';
import { userService } from '../services/userService';

interface ReferenceImageSelectorProps {
  onClose: () => void;
  onSelect?: (imageUrl: string) => void;
  userId?: string;
  onImagesSelected?: (imageUrls: string[]) => void;
}

type DatabaseType = 'public' | 'private';

export default function ReferenceImageSelector({ onClose, onSelect, userId, onImagesSelected }: ReferenceImageSelectorProps) {
  const [databaseType, setDatabaseType] = useState<DatabaseType>('public');
  const [publicProducts, setPublicProducts] = useState<ProductWithImages[]>([]);
  const [privateImages, setPrivateImages] = useState<ReferenceImage[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [databaseType, userId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (databaseType === 'public') {
        const products = await PublicReferenceImageService.getProductsWithImages();
        setPublicProducts(products);
      } else {
        if (userId) {
          const images = await ReferenceImageService.getUserImages(userId);
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

  const handleProductClick = (product: ProductWithImages) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
  };

  const handleSelectImage = async () => {
    if (selectedProduct && selectedProduct.images.length > 0) {
      const selectedImage = selectedProduct.images[selectedImageIndex];
      const imageUrl = selectedImage.image_url;

      const newSelectedUrls = [...selectedImageUrls, imageUrl];
      setSelectedImageUrls(newSelectedUrls);

      if (userId) {
        try {
          await userService.saveDefaultReferenceImages(userId, newSelectedUrls);
        } catch (error) {
          console.error('Failed to save default reference images:', error);
        }
      }

      onSelect?.(imageUrl);
      onImagesSelected?.(newSelectedUrls);
      onClose();
    }
  };

  const handleSelectPrivateImage = async (image: ReferenceImage) => {
    const imageUrl = image.image_url;
    const newSelectedUrls = [...selectedImageUrls, imageUrl];
    setSelectedImageUrls(newSelectedUrls);

    if (userId) {
      try {
        await userService.saveDefaultReferenceImages(userId, newSelectedUrls);
      } catch (error) {
        console.error('Failed to save default reference images:', error);
      }
    }

    onSelect?.(imageUrl);
    onImagesSelected?.(newSelectedUrls);
    onClose();
  };

  const getCurrentImage = (): PublicReferenceImage | null => {
    if (!selectedProduct || selectedProduct.images.length === 0) return null;
    return selectedProduct.images[selectedImageIndex];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">选择参考图片</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setDatabaseType('public');
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
                setDatabaseType('private');
                setSelectedProduct(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                databaseType === 'private'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!userId}
            >
              私有数据库
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
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
              {databaseType === 'public' && !selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {product.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">货号: {product.product_code}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        {product.images.length} 张图片
                      </div>
                    </div>
                  ))}
                  {publicProducts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      暂无公共参考图片
                    </div>
                  )}
                </div>
              )}

              {databaseType === 'public' && selectedProduct && (
                <div className="flex flex-col lg:flex-row gap-6">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4 lg:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回商品列表
                  </button>

                  <div className="lg:w-1/4">
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      返回
                    </button>
                    <div className="space-y-2">
                      {selectedProduct.images.map((image, index) => (
                        <div
                          key={image.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImageIndex === index
                              ? 'border-blue-600 shadow-md'
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
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-3/4">
                    {getCurrentImage() && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {selectedProduct.title}
                          </h3>
                          <p className="text-sm text-gray-500">货号: {selectedProduct.product_code}</p>
                        </div>
                        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getCurrentImage()!.image_url}
                            alt={getCurrentImage()!.file_name}
                            className="w-full h-auto max-h-[500px] object-contain"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">
                            图片 {selectedImageIndex + 1} / {selectedProduct.images.length}
                          </p>
                          <button
                            onClick={handleSelectImage}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            选择此图片
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {databaseType === 'private' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {privateImages.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => handleSelectPrivateImage(image)}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <img
                        src={image.thumbnail_url || image.image_url}
                        alt={image.file_name}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium transition-opacity">
                          选择
                        </button>
                      </div>
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate">{image.file_name}</p>
                      </div>
                    </div>
                  ))}
                  {privateImages.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      {userId ? '暂无私有参考图片' : '请先登录'}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
