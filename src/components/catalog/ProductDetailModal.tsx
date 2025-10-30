import React, { useState } from 'react';
import { X, Heart, MessageCircle, Package, Lightbulb, BookOpen, FileText } from 'lucide-react';
import type { CatalogProductWithCategory } from '../../types/catalog';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';
import { ImageWithFallback } from '../ImageWithFallback';

interface ProductDetailModalProps {
  product: CatalogProductWithCategory;
  userId?: string;
  onClose: () => void;
  onToggleLike: (productId: string) => Promise<void>;
  onCommentCountChange: (productId: string, count: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  userId,
  onClose,
  onToggleLike,
  onCommentCountChange,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
        >
          <X size={24} className="text-gray-700" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative aspect-square bg-gray-100">
              <ImageWithFallback
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 md:p-8 flex flex-col">
              <div className="flex-1">
                <div className="mb-4">
                  {product.category && (
                    <span className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mb-3">
                      {product.category.display_name}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {product.name}
                  </h2>
                </div>

                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200">
                  <LikeButton
                    productId={product.id}
                    liked={product.user_liked || false}
                    likesCount={product.likes_count}
                    onToggleLike={onToggleLike}
                    disabled={!userId}
                  />
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-gray-600">
                    <MessageCircle size={16} />
                    <span className="text-sm font-medium">{product.comments_count}</span>
                  </div>
                </div>

                <div className="border-b border-gray-200 mb-6">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'details'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      产品详情
                    </button>
                    <button
                      onClick={() => setActiveTab('comments')}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'comments'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      评论 ({product.comments_count})
                    </button>
                  </div>
                </div>

                {activeTab === 'details' ? (
                  <div className="space-y-6">
                    {product.size_specs && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Package size={18} className="text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-900">尺寸规格</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {product.size_specs}
                        </p>
                      </div>
                    )}

                    {product.inspiration && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb size={18} className="text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-900">创作灵感</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {product.inspiration}
                        </p>
                      </div>
                    )}

                    {product.story && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <BookOpen size={18} className="text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-900">故事情节</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {product.story}
                        </p>
                      </div>
                    )}

                    {product.description && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText size={18} className="text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-900">其他描述</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {product.description}
                        </p>
                      </div>
                    )}

                    {!product.size_specs &&
                      !product.inspiration &&
                      !product.story &&
                      !product.description && (
                        <div className="text-center py-8 text-gray-500">
                          <p>暂无详细信息</p>
                        </div>
                      )}
                  </div>
                ) : (
                  <CommentSection
                    productId={product.id}
                    userId={userId}
                    onCommentCountChange={(count) => onCommentCountChange(product.id, count)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
