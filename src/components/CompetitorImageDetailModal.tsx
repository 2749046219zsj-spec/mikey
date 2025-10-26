import { useState } from 'react';
import { X, ExternalLink, Download, Trash2, Edit2, Save, Tag, Calendar, FileText, DollarSign } from 'lucide-react';
import { competitorGalleryService, CompetitorImage } from '../services/competitorGalleryService';

interface CompetitorImageDetailModalProps {
  image: CompetitorImage;
  onClose: () => void;
  onUpdate: () => void;
}

export function CompetitorImageDetailModal({ image, onClose, onUpdate }: CompetitorImageDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(image.name || '');
  const [editedCategory, setEditedCategory] = useState(image.category || 'competitor');
  const [editedTags, setEditedTags] = useState(image.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sourceInfo = competitorGalleryService.getImageSourceInfo(image.metadata);

  const handleSave = async () => {
    try {
      setSaving(true);
      const tags = editedTags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      await competitorGalleryService.updateCompetitorImage(image.id, {
        name: editedName,
        category: editedCategory,
        tags,
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这张图片吗？此操作无法撤销。')) {
      return;
    }

    try {
      setDeleting(true);
      await competitorGalleryService.deleteCompetitorImage(image.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = image.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">图片详情</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="下载图片"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="编辑信息"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="删除图片"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧 - 图片预览 */}
            <div className="flex flex-col">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.name || image.file_name}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* 右侧 - 信息 */}
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
                <div className="space-y-3">
                  {/* 名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      名称
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入图片名称"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {image.name || sourceInfo.productName || '未命名'}
                      </p>
                    )}
                  </div>

                  {/* 分类 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分类
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedCategory}
                        onChange={(e) => setEditedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入分类"
                      />
                    ) : (
                      <p className="text-gray-900">{image.category}</p>
                    )}
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      标签
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTags}
                        onChange={(e) => setEditedTags(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="用逗号分隔多个标签"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {image.tags && image.tags.length > 0 ? (
                          image.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">无标签</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 文件名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      文件名
                    </label>
                    <p className="text-gray-600 text-sm">{image.file_name}</p>
                  </div>

                  {/* 创建时间 */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      创建于 {new Date(image.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 来源信息 */}
              {(sourceInfo.pageUrl || sourceInfo.productName || sourceInfo.price) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">来源信息</h3>
                  <div className="space-y-3">
                    {sourceInfo.productName && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">商品名称</div>
                          <div className="text-gray-900">{sourceInfo.productName}</div>
                        </div>
                      </div>
                    )}

                    {sourceInfo.price && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <div className="text-sm font-medium text-gray-700">价格</div>
                          <div className="text-gray-900">{sourceInfo.price}</div>
                        </div>
                      </div>
                    )}

                    {sourceInfo.pageUrl && (
                      <div className="flex items-start gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            来源页面
                          </div>
                          <a
                            href={sourceInfo.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm break-all hover:underline"
                          >
                            {sourceInfo.pageTitle || sourceInfo.pageUrl}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 元数据 */}
              {image.metadata && Object.keys(image.metadata).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">元数据</h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    <pre className="text-gray-700">
                      {JSON.stringify(image.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏（编辑模式） */}
        {isEditing && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              disabled={saving}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
