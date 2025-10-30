import React from 'react';
import { X, Package, Ruler, Lightbulb, BookOpen, FileText } from 'lucide-react';
import { CatalogProduct } from '../services/catalogService';

interface ProductDetailModalProps {
  product: CatalogProduct;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-white" />
            <h3 className="text-xl font-bold text-white">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {product.image_url ? (
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Package size={80} className="text-purple-400" />
                </div>
              )}
            </div>

            <div className="space-y-6">
              {product.size_specs && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Ruler size={16} className="text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">尺寸规格</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed pl-10">{product.size_specs}</p>
                </div>
              )}

              {product.inspiration && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Lightbulb size={16} className="text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">创作灵感</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed pl-10">{product.inspiration}</p>
                </div>
              )}

              {product.story && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <BookOpen size={16} className="text-pink-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">故事情节</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed pl-10">{product.story}</p>
                </div>
              )}

              {product.description && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileText size={16} className="text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">其他描述</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed pl-10">{product.description}</p>
                </div>
              )}

              {!product.size_specs && !product.inspiration && !product.story && !product.description && (
                <div className="text-center py-8 text-gray-500">
                  暂无详细信息
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
