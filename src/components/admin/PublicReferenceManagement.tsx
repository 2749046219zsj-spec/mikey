import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Upload, X, Image as ImageIcon, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PublicReferenceProduct, PublicReferenceImage } from '../../services/publicReferenceImageService';
import type { ProductCategory } from '../../services/productService';
import { productService } from '../../services/productService';
import ProductSpecificationManager from './ProductSpecificationManager';

export default function PublicReferenceManagement() {
  const [products, setProducts] = useState<PublicReferenceProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PublicReferenceProduct | null>(null);
  const [productImages, setProductImages] = useState<Record<string, PublicReferenceImage[]>>({});
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showSpecManager, setShowSpecManager] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    product_code: '',
    category_id: '',
    description: '',
    sort_order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        loadProducts(),
        productService.getAllCategories(true)
      ]);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('public_reference_products')
      .select(`
        *,
        images:public_reference_images(id, image_url, thumbnail_url, display_order)
      `)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading products:', error);
      return [];
    }

    const productsWithFirstImage = (data || []).map(product => ({
      ...product,
      firstImage: product.images?.sort((a: any, b: any) => a.display_order - b.display_order)[0]
    }));

    setProducts(productsWithFirstImage);
    return productsWithFirstImage;
  };

  const loadProductImages = async (productId: string) => {
    const { data, error } = await supabase
      .from('public_reference_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setProductImages(prev => ({ ...prev, [productId]: data }));
    }
  };

  const handleProductClick = async (product: PublicReferenceProduct) => {
    if (expandedProduct === product.id) {
      setExpandedProduct(null);
    } else {
      setExpandedProduct(product.id);
      if (!productImages[product.id]) {
        await loadProductImages(product.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingProduct) {
        const { error } = await supabase
          .from('public_reference_products')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('public_reference_products')
          .insert({ ...formData, created_by: user?.id });

        if (error) throw error;
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此产品及其所有图片吗？')) return;

    try {
      const { error } = await supabase
        .from('public_reference_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('删除失败，请重试');
    }
  };

  const handleEdit = (product: PublicReferenceProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      product_code: product.product_code,
      category_id: product.category_id || '',
      description: product.description,
      sort_order: product.sort_order
    });
    setShowProductForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      product_code: '',
      category_id: '',
      description: '',
      sort_order: 0
    });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  const handleImageUpload = async (productId: string, files: FileList) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const bucketName = 'reference-images';
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);

      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5242880,
        });
      }

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `public/${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from('public_reference_images')
          .insert({
            product_id: productId,
            image_url: urlData.publicUrl,
            file_name: file.name,
            display_order: 0,
            created_by: user?.id
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      await loadProductImages(productId);
      alert(`成功上传 ${files.length} 张图片`);
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      alert(`上传失败: ${error.message || '请重试'}`);
    }
  };

  const handleDeleteImage = async (imageId: string, productId: string) => {
    if (!confirm('确定要删除此图片吗？')) return;

    try {
      const { error } = await supabase
        .from('public_reference_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      await loadProductImages(productId);
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('删除失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">公共参考图管理</h2>
        <button
          onClick={() => setShowProductForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          添加产品
        </button>
      </div>

      {showProductForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingProduct ? '编辑产品' : '新增产品'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品标题
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  货号
                </label>
                <input
                  type="text"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">未分类</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.display_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-md border border-gray-200">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleProductClick(product)}
            >
              <div className="flex items-center justify-between gap-4">
                {(product as any).firstImage ? (
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={(product as any).firstImage.thumbnail_url || (product as any).firstImage.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-500">货号: {product.product_code}</p>
                  {(product as any).images && (
                    <p className="text-xs text-gray-400 mt-1">
                      {(product as any).images.length} 张图片
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(product);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {expandedProduct === product.id && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShowSpecManager(showSpecManager === product.id ? null : product.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${
                      showSpecManager === product.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    {showSpecManager === product.id ? '关闭规格管理' : '管理规格'}
                  </button>
                </div>

                {showSpecManager === product.id && (
                  <div className="mb-4 bg-white rounded-lg p-4 border border-gray-200">
                    <ProductSpecificationManager
                      productId={product.id}
                      onClose={() => setShowSpecManager(null)}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    上传图片
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleImageUpload(product.id, e.target.files)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {productImages[product.id]?.map(image => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.thumbnail_url || image.image_url}
                        alt={image.file_name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleDeleteImage(image.id, product.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!productImages[product.id] || productImages[product.id].length === 0) && (
                    <div className="col-span-4 text-center py-8 text-gray-400">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">暂无图片</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无产品数据
          </div>
        )}
      </div>
    </div>
  );
}
