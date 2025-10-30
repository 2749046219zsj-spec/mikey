import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import { GalleryImage, GallerySortBy } from '../types/gallery';
import { GalleryService } from '../services/galleryService';
import { GalleryImageCard } from './GalleryImageCard';
import { GalleryDetailModal } from './GalleryDetailModal';
import { FloatingAIPanel } from './FloatingAIPanel';
import { useAuth } from '../contexts/AuthContext';
import { ProductCategoryTabs } from './ProductCategoryTabs';
import { CatalogProduct, productCatalogService } from '../services/productCatalogService';
import { ProductDetailModal } from './ProductDetailModal';
import { ImageWithFallback } from './ImageWithFallback';

interface PublicGalleryWithCatalogProps {
  onSubmitGeneration?: (prompt: string, images: File[]) => void;
}

export const PublicGalleryWithCatalog: React.FC<PublicGalleryWithCatalogProps> = ({ onSubmitGeneration }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<GallerySortBy>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [floatingPrompt, setFloatingPrompt] = useState<string>('');
  const [floatingImages, setFloatingImages] = useState<File[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

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

  const loadTotalCount = async () => {
    const count = await GalleryService.getTotalCount();
    setTotalCount(count);
  };

  useEffect(() => {
    setHasMore(true);
    loadImages(true);
    loadTotalCount();
  }, [sortBy, user?.id]);

  useEffect(() => {
    if (selectedCategoryId) {
      loadCatalogProducts();
    }
  }, [selectedCategoryId]);

  const loadCatalogProducts = async () => {
    if (!selectedCategoryId) return;

    setLoadingProducts(true);
    try {
      const products = await productCatalogService.getProductsByCategory(selectedCategoryId);
      setCatalogProducts(products);
    } catch (error) {
      console.error('Failed to load catalog products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

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

  const handleFloatingPanelSubmit = async (prompt: string, images: File[]) => {
    if (onSubmitGeneration) {
      onSubmitGeneration(prompt, images);
    }
    setShowFloatingPanel(false);
    setFloatingPrompt('');
    setFloatingImages([]);
  };

  return (
    <div className="relative flex-1">
      {/* 背景效果 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 opacity-50" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-orange-400/20 via-red-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* 产品目录分类标签 - 替换图2的位置 */}
        <div className="mb-12">
          <ProductCategoryTabs
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        {/* 产品图片网格 - 显示选中类目的产品 */}
        {selectedCategoryId && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-2xl font-bold text-gray-900">产品展示</h2>
              </div>
              <span className="text-sm text-gray-500">{catalogProducts.length} 件作品</span>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : catalogProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg">该分类暂无产品</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {catalogProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-2xl transition-all duration-300">
                      <ImageWithFallback
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="mt-3 px-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                        {product.name}
                      </h3>
                      {product.size_specs && (
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {product.size_specs}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 探索无限创意标题区域 */}
        <div className="text-center mb-16 mt-20">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full mb-6 shadow-lg border border-gray-200">
            <Sparkles className="text-orange-500" size={20} />
            <span className="text-sm font-medium text-gray-700 tracking-wider uppercase">AI创意画廊</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif font-semibold text-gray-900 mb-4 tracking-tight">
            探索<span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">无限</span>创意
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            发现社区用户分享的精彩AI生成作品，获取灵感，点赞你喜欢的创作
          </p>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center justify-between mb-10 bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center" />
            <span className="text-gray-900 font-semibold">{totalCount} 件作品</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-medium ${
                sortBy === 'latest'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock size={16} />
              最新
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-medium ${
                sortBy === 'popular'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp size={16} />
              热门
            </button>
          </div>
        </div>

        {/* 画廊图片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {images.map((image) => (
            <GalleryImageCard
              key={image.id}
              image={image}
              onImageClick={setSelectedImage}
            />
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && images.length > 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>已加载全部作品</p>
          </div>
        )}
      </div>

      {selectedImage && (
        <GalleryDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onUseAsReference={() => {}}
          onRemake={() => {}}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {showFloatingPanel && (
        <FloatingAIPanel
          initialPrompt={floatingPrompt}
          initialImages={floatingImages}
          onClose={() => {
            setShowFloatingPanel(false);
            setFloatingPrompt('');
            setFloatingImages([]);
          }}
          onSubmit={handleFloatingPanelSubmit}
        />
      )}
    </div>
  );
};
