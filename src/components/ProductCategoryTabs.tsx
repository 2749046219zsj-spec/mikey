import React, { useEffect, useState } from 'react';
import { ProductCategory, productCatalogService } from '../services/productCatalogService';

interface ProductCategoryTabsProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export const ProductCategoryTabs: React.FC<ProductCategoryTabsProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await productCatalogService.getCategories();
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        onSelectCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2 justify-center py-4">
        <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-3 justify-center py-4 px-4 min-w-max">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`
              px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
              ${selectedCategoryId === category.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            {category.display_name}
          </button>
        ))}
      </div>
    </div>
  );
};
