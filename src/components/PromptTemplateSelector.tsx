import React, { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown, Check } from 'lucide-react';
import { usePromptTemplates } from '../hooks/usePromptTemplates';

interface PromptTemplateSelectorProps {
  productCategoryId?: string;
  productName?: string;
  onConfirm: (selectedTemplates: string[]) => void;
  buttonText?: string;
}

export const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({
  productCategoryId,
  productName,
  onConfirm,
  buttonText = '工艺'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const { templates, loading } = usePromptTemplates(productCategoryId);
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

  const toggleTemplate = (templateContent: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateContent)) {
        return prev.filter(t => t !== templateContent);
      } else {
        return [...prev, templateContent];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedTemplates.length > 0) {
      onConfirm(selectedTemplates);
      setSelectedTemplates([]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedTemplates([]);
  };

  if (!productCategoryId) {
    return (
      <button
        disabled
        className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400 font-medium flex items-center gap-1.5 cursor-not-allowed"
      >
        <FileText size={14} />
        <span>请先选择产品</span>
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:border-purple-400 hover:shadow-md rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5 transition-all"
      >
        <FileText size={14} className="text-purple-500" />
        <span>{buttonText}</span>
        {selectedTemplates.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
            {selectedTemplates.length}
          </span>
        )}
        <ChevronDown size={12} className={`text-purple-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[32rem] flex flex-col">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span className="font-semibold">工艺特点选择</span>
            </div>
            <p className="text-xs text-purple-100 mt-1">
              {productName ? `${productName} - 可多选，点击确认添加` : '可多选工艺特点'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                该产品暂无可用的工艺模板
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {templates.map((template) => {
                  const isSelected = selectedTemplates.includes(template.prompt_content);
                  return (
                    <div key={template.id} className="relative">
                      <button
                        onClick={() => toggleTemplate(template.prompt_content)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-400 shadow-md'
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              isSelected
                                ? 'bg-purple-500 border-purple-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                              {template.name}
                              {template.prompt_type && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  {template.prompt_type === 'craft' ? '工艺' : template.prompt_type === 'style' ? '风格' : '通用'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {template.prompt_content}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              清空
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedTemplates.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
            >
              确认 {selectedTemplates.length > 0 && `(${selectedTemplates.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
