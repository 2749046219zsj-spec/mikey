import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useCatalogStore } from '../../stores/catalogStore';
import { catalogService } from '../../services/catalogService';
import { catalogImageService } from '../../services/catalogImageService';
import { useAuth } from '../../contexts/AuthContext';
import { CategoryTabs } from './CategoryTabs';
import { ProductGrid } from './ProductGrid';
import { ProductDetailModal } from './ProductDetailModal';
import type { CatalogProductWithCategory } from '../../types/catalog';

export const ProductCatalog: React.FC = () => {
  const { user } = useAuth();

  console.log('ProductCatalog - user:', user, 'isAdmin:', user?.is_admin);

  const {
    categories,
    selectedCategoryId,
    products,
    currentProduct,
    loading,
    error,
    setCategories,
    setSelectedCategory,
    setProducts,
    setCurrentProduct,
    setLoading,
    setError,
    updateProductLike,
    updateProductCommentCount,
  } = useCatalogStore();

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts(selectedCategoryId);
    }
  }, [selectedCategoryId, user?.id]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await catalogService.getCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategory(data[0].id);
      }
    } catch (err) {
      setError('加载分类失败');
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogService.getProductsByCategory(categoryId, user?.id);
      setProducts(data);
    } catch (err) {
      setError('加载产品失败');
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleViewDetail = async (product: CatalogProductWithCategory) => {
    try {
      const detailProduct = await catalogService.getProductDetail(product.id, user?.id);
      if (detailProduct) {
        setCurrentProduct(detailProduct);
      }
    } catch (err) {
      console.error('Failed to load product detail:', err);
    }
  };

  const handleToggleLike = async (productId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const liked = await catalogService.toggleLike(productId, user.id);
      const product = products.find((p) => p.id === productId);
      if (product) {
        const newLikesCount = liked ? product.likes_count + 1 : product.likes_count - 1;
        updateProductLike(productId, liked, newLikesCount);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleCommentCountChange = (productId: string, count: number) => {
    updateProductCommentCount(productId, count);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      if (product.image_url && product.image_url.includes('catalog-product-images')) {
        try {
          await catalogImageService.deleteProductImage(product.image_url);
        } catch (error) {
          console.warn('Failed to delete product image:', error);
        }
      }

      await catalogService.deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));

      if (currentProduct?.id === productId) {
        setCurrentProduct(null);
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">产品展示</h1>
              <p className="text-gray-600">浏览我们精心策划的产品系列</p>
            </div>
            {user && (
              <div className="text-sm">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <p className="text-gray-600">用户: {user.username}</p>
                  <p className={`font-semibold ${user.is_admin ? 'text-green-600' : 'text-gray-600'}`}>
                    {user.is_admin ? '✓ 管理员' : '普通用户'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <CategoryTabs
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={handleSelectCategory}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center space-x-3 text-red-600 bg-red-50 px-6 py-4 rounded-lg">
              <AlertCircle size={24} />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        ) : (
          <ProductGrid
            products={products}
            loading={loading}
            onViewDetail={handleViewDetail}
            onToggleLike={handleToggleLike}
            onDeleteProduct={user?.is_admin === true ? handleDeleteProduct : undefined}
            canLike={!!user}
            isAdmin={user?.is_admin === true}
          />
        )}
      </div>

      {currentProduct && (
        <ProductDetailModal
          product={currentProduct}
          userId={user?.id}
          isAdmin={user?.is_admin === true}
          onClose={() => setCurrentProduct(null)}
          onToggleLike={handleToggleLike}
          onDeleteProduct={user?.is_admin === true ? handleDeleteProduct : undefined}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">登录后继续</h3>
            <p className="text-gray-600 mb-6">登录后即可点赞和评论产品</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  window.location.href = '/auth';
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                去登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
