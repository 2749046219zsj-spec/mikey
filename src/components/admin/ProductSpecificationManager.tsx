import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProductSpecification {
  id: string;
  product_id: string;
  spec_name: string;
  spec_value: string;
  display_order: number;
  is_visible: boolean;
}

interface ProductSpecificationManagerProps {
  productId: string;
  onClose?: () => void;
}

export default function ProductSpecificationManager({ productId, onClose }: ProductSpecificationManagerProps) {
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    spec_name: '',
    spec_value: '',
    is_visible: true
  });

  useEffect(() => {
    loadSpecifications();
  }, [productId]);

  const loadSpecifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_specifications')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSpecifications(data || []);
    } catch (error) {
      console.error('Failed to load specifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.spec_name.trim() || !formData.spec_value.trim()) {
      alert('请填写规格名称和值');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const maxOrder = specifications.length > 0
        ? Math.max(...specifications.map(s => s.display_order))
        : 0;

      const { error } = await supabase
        .from('product_specifications')
        .insert({
          product_id: productId,
          spec_name: formData.spec_name,
          spec_value: formData.spec_value,
          is_visible: formData.is_visible,
          display_order: maxOrder + 1,
          created_by: user?.id
        });

      if (error) throw error;

      await loadSpecifications();
      setFormData({ spec_name: '', spec_value: '', is_visible: true });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add specification:', error);
      alert('添加失败，请重试');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<ProductSpecification>) => {
    try {
      const { error } = await supabase
        .from('product_specifications')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadSpecifications();
    } catch (error) {
      console.error('Failed to update specification:', error);
      alert('更新失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此规格吗？')) return;

    try {
      const { error } = await supabase
        .from('product_specifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadSpecifications();
    } catch (error) {
      console.error('Failed to delete specification:', error);
      alert('删除失败，请重试');
    }
  };

  const moveSpecification = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === specifications.length - 1)
    ) {
      return;
    }

    const newSpecs = [...specifications];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSpecs[index], newSpecs[targetIndex]] = [newSpecs[targetIndex], newSpecs[index]];

    const updates = newSpecs.map((spec, idx) => ({
      id: spec.id,
      display_order: idx
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('product_specifications')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
      await loadSpecifications();
    } catch (error) {
      console.error('Failed to reorder specifications:', error);
      alert('排序失败，请重试');
    }
  };

  if (loading) {
    return <div className="text-center py-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">产品规格管理</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            添加规格
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                规格名称
              </label>
              <input
                type="text"
                value={formData.spec_name}
                onChange={(e) => setFormData({ ...formData, spec_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="例如：容量"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                规格值
              </label>
              <input
                type="text"
                value={formData.spec_value}
                onChange={(e) => setFormData({ ...formData, spec_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="例如：30毫升"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              在前台显示
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ spec_name: '', spec_value: '', is_visible: true });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {specifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            暂无规格数据，点击"添加规格"开始创建
          </div>
        ) : (
          specifications.map((spec, index) => (
            <div
              key={spec.id}
              className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSpecification(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <GripVertical className="w-4 h-4 rotate-90" />
                </button>
                <button
                  onClick={() => moveSpecification(index, 'down')}
                  disabled={index === specifications.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <GripVertical className="w-4 h-4 -rotate-90" />
                </button>
              </div>

              {editingId === spec.id ? (
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    defaultValue={spec.spec_name}
                    id={`name-${spec.id}`}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                    placeholder="规格名称"
                  />
                  <input
                    type="text"
                    defaultValue={spec.spec_value}
                    id={`value-${spec.id}`}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                    placeholder="规格值"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-medium text-gray-700 text-sm w-32 flex-shrink-0">
                    {spec.spec_name}
                  </span>
                  <span className="text-gray-900 text-sm">
                    {spec.spec_value}
                  </span>
                  {!spec.is_visible && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      已隐藏
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={spec.is_visible}
                    onChange={(e) => handleUpdate(spec.id, { is_visible: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  显示
                </label>

                {editingId === spec.id ? (
                  <>
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById(`name-${spec.id}`) as HTMLInputElement;
                        const valueInput = document.getElementById(`value-${spec.id}`) as HTMLInputElement;
                        handleUpdate(spec.id, {
                          spec_name: nameInput.value,
                          spec_value: valueInput.value
                        });
                        setEditingId(null);
                      }}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(spec.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(spec.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
