import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Save, X } from 'lucide-react';
import { promptTemplateService, PromptTemplate, CreatePromptTemplateInput, UpdatePromptTemplateInput } from '../../services/promptTemplateService';
import { productService, ProductCategory } from '../../services/productService';

export const PromptTemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreatePromptTemplateInput>({
    product_category_id: '',
    name: '',
    prompt_content: '',
    prompt_type: 'craft',
    sort_order: 0,
    is_active: true
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadTemplates();
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const data = await productService.getAllCategories(true);
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await promptTemplateService.getTemplatesByCategory(selectedCategoryId, true);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await promptTemplateService.createTemplate({
        ...formData,
        product_category_id: selectedCategoryId
      });
      setIsCreating(false);
      setFormData({
        product_category_id: selectedCategoryId,
        name: '',
        prompt_content: '',
        prompt_type: 'craft',
        sort_order: 0,
        is_active: true
      });
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const handleUpdate = async (id: string, updates: UpdatePromptTemplateInput) => {
    try {
      setError(null);
      await promptTemplateService.updateTemplate(id, updates);
      setEditingId(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个提示词模板吗？')) {
      return;
    }

    try {
      setError(null);
      await promptTemplateService.deleteTemplate(id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      setError(null);
      await promptTemplateService.toggleTemplateStatus(id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  const startEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormData({
      product_category_id: template.product_category_id,
      name: template.name,
      prompt_content: template.prompt_content,
      prompt_type: template.prompt_type,
      sort_order: template.sort_order,
      is_active: template.is_active
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({
      product_category_id: selectedCategoryId,
      name: '',
      prompt_content: '',
      prompt_type: 'craft',
      sort_order: 0,
      is_active: true
    });
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">提示词模板管理</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择产品分类
        </label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.display_name}
            </option>
          ))}
        </select>
        {selectedCategory && (
          <p className="text-sm text-gray-500 mt-2">
            {selectedCategory.description}
          </p>
        )}
      </div>

      {selectedCategoryId && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              添加提示词模板
            </button>
          </div>

          {isCreating && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">新建提示词模板</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模板名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: 华丽花纹浮雕与烤漆"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    提示词内容
                  </label>
                  <textarea
                    value={formData.prompt_content}
                    onChange={(e) => setFormData({ ...formData, prompt_content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                    placeholder="输入详细的提示词内容..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    字符数: {formData.prompt_content.length}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模板类型
                  </label>
                  <select
                    value={formData.prompt_type}
                    onChange={(e) => setFormData({ ...formData, prompt_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="craft">工艺特点</option>
                    <option value="style">风格样式</option>
                    <option value="general">通用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序顺序
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_create"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active_create" className="text-sm font-medium text-gray-700">
                    启用
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white border rounded-lg p-6 shadow-sm ${
                    !template.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {editingId === template.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          模板名称
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          提示词内容
                        </label>
                        <textarea
                          value={formData.prompt_content}
                          onChange={(e) => setFormData({ ...formData, prompt_content: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          字符数: {formData.prompt_content.length}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          模板类型
                        </label>
                        <select
                          value={formData.prompt_type}
                          onChange={(e) => setFormData({ ...formData, prompt_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="craft">工艺特点</option>
                          <option value="style">风格样式</option>
                          <option value="general">通用</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          排序顺序
                        </label>
                        <input
                          type="number"
                          value={formData.sort_order}
                          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdate(template.id, formData)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {template.name}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              {template.prompt_type === 'craft' ? '工艺' : template.prompt_type === 'style' ? '风格' : '通用'}
                            </span>
                          </div>
                          <p className="text-gray-600 whitespace-pre-wrap">{template.prompt_content}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            排序: {template.sort_order} | 字符数: {template.prompt_content.length}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleToggleStatus(template.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              template.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={template.is_active ? '禁用' : '启用'}
                          >
                            <Power className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => startEdit(template)}
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && templates.length === 0 && !isCreating && (
            <div className="text-center py-12 text-gray-500">
              该产品分类暂无提示词模板，点击"添加提示词模板"按钮创建第一个模板
            </div>
          )}
        </>
      )}
    </div>
  );
};
