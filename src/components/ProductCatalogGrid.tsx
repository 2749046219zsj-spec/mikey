import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { CatalogProduct, productCatalogService, ProductCategory } from '../services/productCatalogService';
import { ImageWithFallback } from './ImageWithFallback';
import { GalleryCatalogGrid } from './GalleryCatalogGrid';

interface ProductCatalogGridProps {
  categoryId: string;
  onProductClick: (product: CatalogProduct) => void;
  onSubmitGeneration?: (prompt: string, images: File[]) => void;
}

export const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  categoryId,
  onProductClick,
  onSubmitGeneration,
}) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAICreativeCategory, setIsAICreativeCategory] = useState(false);
  const [subCategories, setSubCategories] = useState<ProductCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (categoryId) {
      checkIfAICreativeCategory();
      loadProducts();
    }
  }, [categoryId]);

  const checkIfAICreativeCategory = async () => {
    try {
      const categories = await productCatalogService.getCategories();
      const category = categories.find(c => c.id === categoryId);
      const isAICategory = category?.name === 'ai-creative-works';
      setIsAICreativeCategory(isAICategory);

      if (isAICategory) {
        const otherCategories = categories.filter(c => c.name !== 'ai-creative-works');
        setSubCategories(otherCategories);
      }
    } catch (error) {
      console.error('Error checking category:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productCatalogService.getProductsByCategory(categoryId);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isAICreativeCategory) {
    return (
      <div>
        <div className="w-full overflow-x-auto mb-6">
          <div className="flex gap-3 justify-center py-4 px-4 min-w-max">
            <button
              onClick={() => setSelectedSubCategory(undefined)}
              className={`
                px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                ${!selectedSubCategory
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              全部作品
            </button>
            {subCategories.map((subCategory) => (
              <button
                key={subCategory.id}
                onClick={() => setSelectedSubCategory(subCategory.name)}
                className={`
                  px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${selectedSubCategory === subCategory.name
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }
                `}
              >
                {subCategory.display_name}
              </button>
            ))}
          </div>
        </div>

        <GalleryCatalogGrid
          productType={selectedSubCategory}
          onSubmitGeneration={onSubmitGeneration}
        />
      </div>
    );
  }

  if (loading) {
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

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-lg font-medium">该分类暂无产品</p>
        <p className="text-sm mt-1">请选择其他分类或联系管理员添加产品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {products.map((product) => (
        <div
          key={product.id}
          onClick={() => onProductClick(product)}
          className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
        >
          <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <ImageWithFallback
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
              {product.name}
            </h3>

            {product.size_specs && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                尺寸：{product.size_specs}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{product.likes_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{product.comments_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
