import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Upload, GripVertical } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { catalogImageService } from '../../services/catalogImageService';
import type { ProductCategory, CatalogProduct } from '../../types/catalog';
import { useAuth } from '../../contexts/AuthContext';

export const ProductCatalogManager: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<CatalogProduct> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async (categoryId: string) => {
    try {
      setLoading(true);
      const data = await catalogService.getProductsByCategory(categoryId, user?.id);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setIsCreating(true);
    setEditingProduct({
      category_id: selectedCategoryId || '',
      name: '',
      image_url: '',
      size_specs: '',
      inspiration: '',
      story: '',
      description: '',
      display_order: products.length,
      is_active: true,
    });
  };

  const handleEditProduct = (product: CatalogProduct) => {
    setIsCreating(false);
    setEditingProduct(product);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !user) return;

    try {
      if (isCreating) {
        const newProduct = await catalogService.createProduct({
          ...editingProduct,
          created_by: user.id,
        });
        setProducts([...products, newProduct]);
      } else if (editingProduct.id) {
        await catalogService.updateProduct(editingProduct.id, editingProduct);
        setProducts(
          products.map((p) => (p.id === editingProduct.id ? { ...p, ...editingProduct } : p))
        );
      }
      setEditingProduct(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;

    try {
      await catalogService.deleteProduct(productId);
      setProducts(products.filter((p) => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('删除失败，请重试');
    }
  };

  const handleToggleActive = async (product: CatalogProduct) => {
    try {
      await catalogService.updateProduct(product.id, { is_active: !product.is_active });
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (error) {
      console.error('Failed to toggle active status:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('只支持 JPEG、PNG、WebP 和 GIF 格式的图片');
      return;
    }

    try {
      setUploadingImage(true);
      const imageUrl = await catalogImageService.uploadProductImage(file, user.id);
      setEditingProduct({ ...editingProduct, image_url: imageUrl });
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">产品目录管理</h2>
        <button
          onClick={handleCreateProduct}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>添加产品</span>
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.display_name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg border-2 p-4 ${
                product.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="cursor-move text-gray-400">
                  <GripVertical size={20} />
                </div>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {product.description || product.inspiration || '暂无描述'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>排序: {product.display_order}</span>
                    <span>点赞: {product.likes_count}</span>
                    <span>评论: {product.comments_count}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      product.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {product.is_active ? '已启用' : '已禁用'}
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              该分类下暂无产品
            </div>
          )}
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {isCreating ? '添加产品' : '编辑产品'}
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  产品名称 *
                </label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入产品名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  产品图片
                </label>
                <div className="space-y-3">
                  {editingProduct.image_url && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={editingProduct.image_url}
                        alt="产品预览"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <label
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer ${
                        uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload size={18} />
                      <span>{uploadingImage ? '上传中...' : '上传图片'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editingProduct.image_url || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image_url: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="或直接输入图片URL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  尺寸规格
                </label>
                <textarea
                  value={editingProduct.size_specs || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, size_specs: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="请输入尺寸规格"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  创作灵感
                </label>
                <textarea
                  value={editingProduct.inspiration || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, inspiration: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="请输入创作灵感"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  故事情节
                </label>
                <textarea
                  value={editingProduct.story || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, story: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="请输入故事情节"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  其他描述
                </label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="请输入其他描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示顺序
                </label>
                <input
                  type="number"
                  value={editingProduct.display_order || 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingProduct.is_active}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  启用产品
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreating(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={!editingProduct.name}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Save size={18} />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
