import React from 'react';
import { Loader2 } from 'lucide-react';
import type { CatalogProductWithCategory } from '../../types/catalog';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: CatalogProductWithCategory[];
  loading: boolean;
  onViewDetail: (product: CatalogProductWithCategory) => void;
  onToggleLike: (productId: string) => Promise<void>;
  onDeleteProduct?: (productId: string) => Promise<void>;
  canLike: boolean;
  isAdmin?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  onViewDetail,
  onToggleLike,
  onDeleteProduct,
  canLike,
  isAdmin = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <svg
          className="w-24 h-24 mb-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-lg font-medium">暂无产品</p>
        <p className="text-sm mt-1">该分类下还没有添加产品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetail={onViewDetail}
          onToggleLike={onToggleLike}
          onDeleteProduct={onDeleteProduct}
          canLike={canLike}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};
