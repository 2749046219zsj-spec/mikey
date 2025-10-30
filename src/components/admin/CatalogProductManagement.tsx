import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Save, X } from 'lucide-react';
import { catalogService, ProductCategory, CatalogProduct } from '../../services/catalogService';
import { useAuth } from '../../contexts/AuthContext';

export const CatalogProductManagement: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<CatalogProduct> | null>(null);

  useEffect(() => {
    if (user?.is_admin || user?.permissions.can_manage_products) {
      loadCategories();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const data = await catalogService.getAllCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      alert('加载分类失败');
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

  const handleAddProduct = () => {
    setEditingProduct({
      category_id: selectedCategory,
      name: '',
      image_url: '',
      size_specs: '',
      inspiration: '',
      story: '',
      description: '',
      display_order: 0,
      is_active: true,
      created_by: user?.id || null
    });
    setIsEditing(true);
  };

  const handleEditProduct = (product: CatalogProduct) => {
    setEditingProduct(product);
    setIsEditing(true);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        await catalogService.updateProduct(editingProduct.id, editingProduct);
        alert('产品更新成功');
      } else {
        await catalogService.createProduct(editingProduct as Omit<CatalogProduct, 'id' | 'created_at' | 'updated_at'>);
        alert('产品创建成功');
      }
      setIsEditing(false);
      setEditingProduct(null);
      loadProducts(selectedCategory);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('保存失败: ' + (error as Error).message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;

    try {
      await catalogService.deleteProduct(productId);
      alert('产品删除成功');
      loadProducts(selectedCategory);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('删除失败: ' + (error as Error).message);
    }
  };

  if (!user?.is_admin && !user?.permissions.can_manage_products) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">您没有产品管理权限</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">产品目录管理</h2>
          <p className="text-sm text-gray-600 mt-1">管理产品分类和产品详情信息</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          添加产品
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">选择分类</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.display_name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {product.image_url ? (
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <Package size={48} className="text-gray-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    {product.size_specs && (
                      <p className="text-sm text-gray-600 mb-2">规格: {product.size_specs}</p>
                    )}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      >
                        <Edit2 size={14} />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">该分类暂无产品</p>
              <button
                onClick={handleAddProduct}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                添加第一个产品
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingProduct.id ? '编辑产品' : '添加产品'}
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingProduct(null);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
                <input
                  type="text"
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入产品名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品图片URL</label>
                <input
                  type="text"
                  value={editingProduct.image_url || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入图片URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">尺寸规格</label>
                <textarea
                  value={editingProduct.size_specs || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, size_specs: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入尺寸规格"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">创作灵感</label>
                <textarea
                  value={editingProduct.inspiration || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, inspiration: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入创作灵感"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">故事情节</label>
                <textarea
                  value={editingProduct.story || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, story: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入故事情节"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">其他描述</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入其他描述信息"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">显示顺序</label>
                  <input
                    type="number"
                    value={editingProduct.display_order || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={editingProduct.is_active ? 'true' : 'false'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.value === 'true' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">启用</option>
                    <option value="false">禁用</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={!editingProduct.name}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
