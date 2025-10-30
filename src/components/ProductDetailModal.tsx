import React, { useEffect, useState } from 'react';
import { X, Heart, MessageCircle, Send, Trash2, Edit2, Check } from 'lucide-react';
import {
  CatalogProduct,
  ProductComment,
  productCatalogService,
} from '../services/productCatalogService';
import { ImageWithFallback } from './ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';

interface ProductDetailModalProps {
  product: CatalogProduct;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product: initialProduct,
  onClose,
}) => {
  const { user } = useAuth();
  const [product, setProduct] = useState(initialProduct);
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    loadProductData();
  }, [product.id]);

  const loadProductData = async () => {
    try {
      const [productData, commentsData, likedStatus] = await Promise.all([
        productCatalogService.getProductById(product.id),
        productCatalogService.getProductComments(product.id),
        productCatalogService.checkIfLiked(product.id),
      ]);

      if (productData) setProduct(productData);
      setComments(commentsData);
      setIsLiked(likedStatus);
    } catch (error) {
      console.error('Error loading product data:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('请先登录后再点赞');
      return;
    }

    try {
      const newLikedState = await productCatalogService.toggleLike(product.id);
      setIsLiked(newLikedState);
      setProduct((prev) => ({
        ...prev,
        likes_count: prev.likes_count + (newLikedState ? 1 : -1),
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      alert('请先登录后再评论');
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await productCatalogService.addComment(product.id, newComment);
      setNewComment('');
      await loadProductData();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('评论失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = (comment: ProductComment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.comment_text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingText.trim()) return;

    try {
      await productCatalogService.updateComment(commentId, editingText);
      setEditingCommentId(null);
      setEditingText('');
      await loadProductData();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('更新评论失败');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await productCatalogService.deleteComment(commentId);
      await loadProductData();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('删除评论失败');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-8 p-6">
              <div className="space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  <ImageWithFallback
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                      isLiked
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{product.likes_count || 0}</span>
                  </button>

                  <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-100 text-gray-700">
                    <MessageCircle className="w-5 h-5" />
                    <span>{product.comments_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {product.size_specs && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      产品尺寸
                    </h3>
                    <p className="text-gray-900">{product.size_specs}</p>
                  </div>
                )}

                {product.inspiration && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      创作灵感
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{product.inspiration}</p>
                  </div>
                )}

                {product.story && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      产品故事
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{product.story}</p>
                  </div>
                )}

                {product.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      产品描述
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold mb-4">评论 ({comments.length})</h3>

                  <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                              {comment.user_profiles?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-gray-900">
                              {comment.user_profiles?.username || '匿名用户'}
                            </span>
                          </div>

                          {user?.id === comment.user_id && (
                            <div className="flex gap-2">
                              {editingCommentId === comment.id ? (
                                <button
                                  onClick={() => handleSaveEdit(comment.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {editingCommentId === comment.id ? (
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            rows={2}
                          />
                        ) : (
                          <p className="text-gray-700 text-sm">{comment.comment_text}</p>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(comment.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder={user ? '添加评论...' : '请先登录后评论'}
                      disabled={!user || loading}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!user || loading || !newComment.trim()}
                      className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
