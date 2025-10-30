import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { UnifiedCategoryNav } from './UnifiedCategoryNav';
import { ProductCatalogGrid } from './ProductCatalogGrid';
import { ProductDetailModal } from './ProductDetailModal';
import { CatalogProduct, productCatalogService } from '../services/productCatalogService';

interface ProductCatalogProps {
  onSubmitGeneration?: (prompt: string, images: File[]) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ onSubmitGeneration }) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    if (selectedCategoryName) {
      loadCategoryId();
    } else {
      setSelectedCategoryId(null);
    }
  }, [selectedCategoryName]);

  const loadCategoryId = async () => {
    try {
      const categories = await productCatalogService.getCategories();
      const category = categories.find(c => c.name === selectedCategoryName);
      setSelectedCategoryId(category?.id || null);
    } catch (error) {
      console.error('Failed to load category:', error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-orange-50/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full mb-6 shadow-luxury-sm border border-elegant-sand/30">
            <Package className="text-hermes-orange" size={20} />
            <span className="text-sm font-medium text-elegant-charcoal tracking-wider uppercase">产品目录</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-elegant-black mb-4 tracking-tight">
            探索<span className="text-luxury-gradient">精美</span>产品系列
          </h1>
          <p className="text-lg text-elegant-gray max-w-2xl mx-auto leading-relaxed font-light">
            浏览我们精心策划的产品目录，每一件都是艺术与工艺的完美结合
          </p>
        </div>

        {/* 分类导航 */}
        <UnifiedCategoryNav
          selectedCategoryName={selectedCategoryName}
          onSelectCategory={setSelectedCategoryName}
        />

        {/* 产品网格 */}
        {selectedCategoryId ? (
          <ProductCatalogGrid
            categoryId={selectedCategoryId}
            onProductClick={setSelectedProduct}
            onSubmitGeneration={onSubmitGeneration}
          />
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-luxury">
              <Package size={40} className="text-luxury-gold" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-elegant-black mb-3">
              选择一个分类开始浏览
            </h3>
            <p className="text-elegant-gray font-light">
              从上方选择感兴趣的产品分类
            </p>
          </div>
        )}

        {/* 产品详情模态框 */}
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </div>
  );
};
