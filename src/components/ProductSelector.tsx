import React, { useState, useRef, useEffect } from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { productTemplates, ProductTemplate } from '../data/productTemplates';

interface ProductSelectorProps {
  onSelectProduct: (product: ProductTemplate) => void;
  buttonText?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onSelectProduct,
  buttonText = '产品'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (template: ProductTemplate) => {
    onSelectProduct(template);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:border-purple-400 hover:shadow-md rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5 transition-all"
      >
        <Package size={14} className="text-purple-500" />
        <span>{buttonText}</span>
        <ChevronDown size={12} className={`text-purple-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Package size={16} />
              <span className="font-semibold">选择产品类型</span>
            </div>
            <p className="text-xs text-purple-100 mt-1">点击选择香水瓶设计类型</p>
          </div>

          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {productTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 rounded-lg transition-all hover:shadow-md border border-gray-200 hover:border-purple-300 font-medium"
              >
                {template.name}
              </button>
            ))}
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">提示：</span>选择产品后会自动生成包含风格和工艺的完整提示词
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
