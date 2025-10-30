import React from 'react';
import { MessageCircle, Eye } from 'lucide-react';
import type { CatalogProductWithCategory } from '../../types/catalog';
import { LikeButton } from './LikeButton';
import { ImageWithFallback } from '../ImageWithFallback';

interface ProductCardProps {
  product: CatalogProductWithCategory;
  onViewDetail: (product: CatalogProductWithCategory) => void;
  onToggleLike: (productId: string) => Promise<void>;
  canLike: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetail,
  onToggleLike,
  canLike,
}) => {
  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
      onClick={() => onViewDetail(product)}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(product);
              }}
              className="w-full bg-white/90 backdrop-blur-sm text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-white transition-colors flex items-center justify-center space-x-2"
            >
              <Eye size={18} />
              <span>查看详情</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LikeButton
              productId={product.id}
              liked={product.user_liked || false}
              likesCount={product.likes_count}
              onToggleLike={onToggleLike}
              disabled={!canLike}
            />

            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-gray-600">
              <MessageCircle size={16} />
              <span className="text-sm font-medium">{product.comments_count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
