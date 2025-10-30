import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import {
  CatalogProduct,
  ProductCategory,
  productCatalogService,
} from '../../services/productCatalogService';
import { supabase } from '../../lib/supabase';

export const ProductCatalogManagement: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts();
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const data = await productCatalogService.getCategories();
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productCatalogService.getProductsByCategory(selectedCategoryId);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;

    try {
      await productCatalogService.deleteProduct(productId);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('删除失败');
    }
  };

  const handleReorder = async (productId: string, direction: 'up' | 'down') => {
    const currentIndex = products.findIndex((p) => p.id === productId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === products.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentProduct = products[currentIndex];
    const swapProduct = products[newIndex];

    try {
      await Promise.all([
        productCatalogService.updateProductOrder(currentProduct.id, swapProduct.display_order),
        productCatalogService.updateProductOrder(swapProduct.id, currentProduct.display_order),
      ]);
      loadProducts();
    } catch (error) {
      console.error('Error reordering products:', error);
      alert('调整顺序失败');
    }
  };

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">产品目录管理</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加产品
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.display_name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                图片
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                尺寸
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                点赞/评论
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                状态
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  该分类暂无产品
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{product.size_specs || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {product.likes_count || 0} / {product.comments_count || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReorder(product.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(product.id, 'down')}
                        disabled={index === products.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowAddModal(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <ProductFormModal
          product={editingProduct}
          categoryId={selectedCategoryId}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingProduct(null);
            loadProducts();
          }}
        />
      )}
    </div>
  );
};

interface ProductFormModalProps {
  product: CatalogProduct | null;
  categoryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categoryId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    image_url: product?.image_url || '',
    size_specs: product?.size_specs || '',
    inspiration: product?.inspiration || '',
    story: product?.story || '',
    description: product?.description || '',
    is_active: product?.is_active ?? true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `catalog-products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('public-images').getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: data.publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (product) {
        await productCatalogService.updateProduct(product.id, formData);
      } else {
        const maxOrder = await getMaxDisplayOrder();
        await productCatalogService.createProduct({
          ...formData,
          category_id: categoryId,
          display_order: maxOrder + 1,
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const getMaxDisplayOrder = async (): Promise<number> => {
    const products = await productCatalogService.getProductsByCategory(categoryId);
    return Math.max(...products.map((p) => p.display_order), 0);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold">{product ? '编辑产品' : '添加产品'}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品图片
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品尺寸
            </label>
            <input
              type="text"
              value={formData.size_specs}
              onChange={(e) => setFormData({ ...formData, size_specs: e.target.value })}
              placeholder="例如：50ml, 100ml"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              创作灵感
            </label>
            <textarea
              value={formData.inspiration}
              onChange={(e) => setFormData({ ...formData, inspiration: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品故事
            </label>
            <textarea
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              启用产品
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : product ? '更新' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
