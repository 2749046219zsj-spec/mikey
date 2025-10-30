import React, { useState } from 'react';
import { ProductCategoryTabs } from './ProductCategoryTabs';
import { ProductCatalogGrid } from './ProductCatalogGrid';
import { ProductDetailModal } from './ProductDetailModal';
import { CatalogProduct } from '../services/productCatalogService';

export const ProductCatalog: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-8 px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">产品目录</h2>
          <p className="text-gray-600">探索我们的精美产品系列</p>
        </div>

        <ProductCategoryTabs
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {selectedCategoryId && (
          <ProductCatalogGrid
            categoryId={selectedCategoryId}
            onProductClick={setSelectedProduct}
          />
        )}

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
