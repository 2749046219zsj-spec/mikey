import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import type { RechargePackage } from '../../types/payment';

export const RechargePackageManager: React.FC = () => {
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Partial<RechargePackage> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAllPackages();
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages:', error);
      alert('加载套餐失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPackage({
      name: '',
      description: '',
      price: 0,
      draw_count: 0,
      bonus_draws: 0,
      validity_days: null,
      is_active: true,
      display_order: packages.length,
    });
  };

  const handleEdit = (pkg: RechargePackage) => {
    setIsCreating(false);
    setEditingPackage(pkg);
  };

  const handleSave = async () => {
    if (!editingPackage) return;

    try {
      if (isCreating) {
        await paymentService.createPackage(editingPackage);
      } else if (editingPackage.id) {
        await paymentService.updatePackage(editingPackage.id, editingPackage);
      }
      await loadPackages();
      setEditingPackage(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to save package:', error);
      alert('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个套餐吗？')) return;

    try {
      await paymentService.deletePackage(id);
      await loadPackages();
    } catch (error) {
      console.error('Failed to delete package:', error);
      alert('删除失败');
    }
  };

  const handleToggleActive = async (pkg: RechargePackage) => {
    try {
      await paymentService.updatePackage(pkg.id, { is_active: !pkg.is_active });
      await loadPackages();
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">充值套餐管理</h2>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>添加套餐</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <div className="grid gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-lg border-2 p-4 ${
                pkg.is_active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-lg text-gray-900">{pkg.name}</h3>
                    <span className="text-2xl font-bold text-blue-600">¥{pkg.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm">
                    <span className="text-gray-700">
                      基础次数: <span className="font-semibold">{pkg.draw_count}</span>
                    </span>
                    {pkg.bonus_draws > 0 && (
                      <span className="text-green-600">
                        额外赠送: <span className="font-semibold">+{pkg.bonus_draws}</span>
                      </span>
                    )}
                    <span className="text-gray-500">排序: {pkg.display_order}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      pkg.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pkg.is_active ? '已启用' : '已禁用'}
                  </button>
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {packages.length === 0 && (
            <div className="text-center py-12 text-gray-500">暂无套餐</div>
          )}
        </div>
      )}

      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {isCreating ? '添加套餐' : '编辑套餐'}
              </h3>
              <button
                onClick={() => {
                  setEditingPackage(null);
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
                  套餐名称 *
                </label>
                <input
                  type="text"
                  value={editingPackage.name || ''}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="如：基础套餐"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">套餐描述</label>
                <textarea
                  value={editingPackage.description || ''}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="套餐描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    价格（元）*
                  </label>
                  <input
                    type="number"
                    value={editingPackage.price || 0}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) || 0 })
                    }
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    绘图次数 *
                  </label>
                  <input
                    type="number"
                    value={editingPackage.draw_count || 0}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, draw_count: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    额外赠送
                  </label>
                  <input
                    type="number"
                    value={editingPackage.bonus_draws || 0}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, bonus_draws: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    显示顺序
                  </label>
                  <input
                    type="number"
                    value={editingPackage.display_order || 0}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, display_order: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingPackage.is_active}
                  onChange={(e) =>
                    setEditingPackage({ ...editingPackage, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  启用套餐
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setIsCreating(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!editingPackage.name || !editingPackage.price}
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
