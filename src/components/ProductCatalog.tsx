import React, { useState, useEffect } from 'react';
import { Package, Search, X } from 'lucide-react';
import { catalogService, ProductCategory, CatalogProduct } from '../services/catalogService';
import { ProductDetailModal } from './ProductDetailModal';

export const ProductCatalog: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getActiveCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (categoryId: string) => {
    try {
      const data = await catalogService.getProductsByCategory(categoryId);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    }
  };

  const handleCategoryClick = (category: ProductCategory) => {
    setSelectedCategory(category);
    loadProducts(category.id);
  };

  const handleProductClick = (product: CatalogProduct) => {
    setSelectedProduct(product);
  };

  const filteredCategories = categories.filter(cat =>
    cat.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-purple-50/50 to-pink-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">产品分类</h2>
              <p className="text-sm text-gray-600">浏览我们的精选产品系列</p>
            </div>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索分类..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="group relative bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package size={28} className="text-purple-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">
                    {category.display_name}
                  </h3>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">暂无产品分类</p>
          </div>
        )}
      </div>

      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCategory.display_name}</h3>
                <p className="text-white/90 text-sm mt-1">{selectedCategory.description}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setProducts([]);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-purple-300 text-left"
                    >
                      {product.image_url ? (
                        <div className="aspect-square bg-gray-200 overflow-hidden">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <Package size={48} className="text-purple-400" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {product.name}
                        </h4>
                        {product.size_specs && (
                          <p className="text-xs text-gray-500 mt-1">规格: {product.size_specs}</p>
                        )}
                        {product.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">该分类暂无产品</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};
