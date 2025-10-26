import { useState, useEffect } from 'react';
import { Search, Filter, X, ExternalLink, Tag, Calendar, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { competitorGalleryService, CompetitorImage } from '../services/competitorGalleryService';
import { CompetitorImageDetailModal } from './CompetitorImageDetailModal';

interface CompetitorGalleryProps {
  onBack?: () => void;
}

export function CompetitorGallery({ onBack }: CompetitorGalleryProps) {
  const [images, setImages] = useState<CompetitorImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<CompetitorImage | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterImages();
  }, [searchTerm, selectedCategory, selectedTags]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [imagesData, categoriesData, tagsData] = await Promise.all([
        competitorGalleryService.getCompetitorImages(),
        competitorGalleryService.getCategories(),
        competitorGalleryService.getAllTags(),
      ]);

      setImages(imagesData);
      setCategories(categoriesData);
      setAllTags(tagsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterImages = async () => {
    try {
      setLoading(true);
      const filtered = await competitorGalleryService.getCompetitorImages({
        category: selectedCategory || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        searchTerm: searchTerm || undefined,
      });
      setImages(filtered);
    } catch (error) {
      console.error('筛选图片失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedTags([]);
  };

  const hasActiveFilters = searchTerm || selectedCategory || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="返回"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                  </button>
                )}
                <h1 className="text-3xl font-bold text-gray-900">竞品图库</h1>
              </div>
              <p className="text-gray-600">
                浏览和管理从浏览器扩展上传的竞品参考图片
              </p>
            </div>
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索图片名称或文件名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 筛选按钮 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              筛选
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
                清除
              </button>
            )}
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 分类筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">全部分类</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 标签筛选 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 图片网格 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? '未找到匹配的图片' : '还没有竞品图片'}
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? '尝试调整筛选条件'
                : '使用浏览器扩展上传第一张竞品图片'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              共 {images.length} 张图片
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <CompetitorImageCard
                  key={image.id}
                  image={image}
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 图片详情模态框 */}
      {selectedImage && (
        <CompetitorImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

interface CompetitorImageCardProps {
  image: CompetitorImage;
  onClick: () => void;
}

function CompetitorImageCard({ image, onClick }: CompetitorImageCardProps) {
  const sourceInfo = competitorGalleryService.getImageSourceInfo(image.metadata);

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* 图片 */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={image.image_url}
          alt={image.name || image.file_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* 信息 */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
          {image.name || sourceInfo.productName || '未命名'}
        </h3>

        {/* 标签 */}
        {image.tags && image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {image.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {image.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                +{image.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 来源 */}
        {sourceInfo.pageUrl && (
          <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{sourceInfo.pageTitle || '查看来源'}</span>
          </div>
        )}

        {/* 日期 */}
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <Calendar className="w-3 h-3" />
          {new Date(image.created_at).toLocaleDateString('zh-CN')}
        </div>
      </div>
    </div>
  );
}
