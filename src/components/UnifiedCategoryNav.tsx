import React, { useEffect, useState } from 'react';
import { Sparkles, Grid, Search } from 'lucide-react';
import { productCatalogService, ProductCategory } from '../services/productCatalogService';

interface UnifiedCategoryNavProps {
  selectedCategoryName: string | null;
  onSelectCategory: (categoryName: string | null) => void;
  showSearch?: boolean;
  onSearchChange?: (query: string) => void;
}

export const UnifiedCategoryNav: React.FC<UnifiedCategoryNavProps> = ({
  selectedCategoryName,
  onSelectCategory,
  showSearch = false,
  onSearchChange
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await productCatalogService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-luxury-sm border border-elegant-sand/20 p-6 mb-8">
      {/* 搜索栏 */}
      {showSearch && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-elegant-gray" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索创意作品..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-elegant-sand focus:border-hermes-orange focus:outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-3">
        {/* 全部分类 */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm tracking-wide transition-luxury ${
            selectedCategoryName === null
              ? 'bg-gradient-sunset text-white shadow-luxury-md'
              : 'bg-white text-elegant-charcoal hover:bg-elegant-cream border-2 border-elegant-sand'
          }`}
        >
          <Grid size={16} />
          <span>全部</span>
        </button>

        {/* 产品分类 */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.name)}
            className={`px-5 py-2.5 rounded-full font-medium text-sm tracking-wide transition-luxury ${
              selectedCategoryName === category.name
                ? 'bg-gradient-sunset text-white shadow-luxury-md'
                : 'bg-white text-elegant-charcoal hover:bg-elegant-cream border-2 border-elegant-sand'
            }`}
            title={category.description}
          >
            {category.display_name}
          </button>
        ))}
      </div>

      {/* 当前筛选提示 */}
      {selectedCategoryName && (
        <div className="mt-4 pt-4 border-t border-elegant-sand/30">
          <div className="flex items-center gap-2 text-sm text-elegant-gray">
            <Sparkles size={16} className="text-hermes-orange" />
            <span>
              当前筛选：
              <span className="font-medium text-elegant-charcoal ml-1">
                {categories.find(c => c.name === selectedCategoryName)?.display_name}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
