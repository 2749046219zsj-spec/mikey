import React from 'react';
import type { ProductCategory } from '../../types/catalog';

interface CategoryTabsProps {
  categories: ProductCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide py-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`
                px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg
                transition-all duration-200 ease-in-out
                ${
                  selectedCategoryId === category.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              {category.display_name}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
