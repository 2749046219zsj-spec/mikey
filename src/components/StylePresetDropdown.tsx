import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown, Sparkles, Plus, X } from 'lucide-react';
import { styleOptionsService, StyleOption } from '../lib/supabase';

interface StyleCategory {
  category: string;
  styles: StyleOption[];
}

interface StylePresetDropdownProps {
  onSelectStyle: (style: string) => void;
  buttonText?: string;
}

export const StylePresetDropdown: React.FC<StylePresetDropdownProps> = ({
  onSelectStyle,
  buttonText = '风格'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [styleCategories, setStyleCategories] = useState<StyleCategory[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleCategory, setNewStyleCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStyles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewStyleName('');
        setNewStyleCategory('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadStyles = async () => {
    try {
      setIsLoading(true);
      const data = await styleOptionsService.getAll();

      const grouped = data.reduce((acc, style) => {
        const category = style.description || '其他';
        const existing = acc.find(c => c.category === category);
        if (existing) {
          existing.styles.push(style);
        } else {
          acc.push({ category, styles: [style] });
        }
        return acc;
      }, [] as StyleCategory[]);

      setStyleCategories(grouped);
    } catch (error) {
      console.error('Failed to load styles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleSelect = (style: string) => {
    onSelectStyle(style);
    setIsOpen(false);
    setIsAddingNew(false);
  };

  const handleAddNew = async () => {
    if (!newStyleName.trim() || !newStyleCategory.trim()) return;

    try {
      await styleOptionsService.create(newStyleName.trim(), newStyleCategory.trim());
      setNewStyleName('');
      setNewStyleCategory('');
      setIsAddingNew(false);
      await loadStyles();
    } catch (error) {
      console.error('Failed to add style:', error);
    }
  };

  const handleDelete = async (id: string, isDefault: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDefault) return;

    try {
      await styleOptionsService.delete(id);
      await loadStyles();
    } catch (error) {
      console.error('Failed to delete style:', error);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:border-purple-400 hover:shadow-md rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5 transition-all"
      >
        <Sparkles size={14} className="text-purple-500" />
        <span>{buttonText}</span>
        <ChevronDown size={12} className={`text-purple-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[32rem] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={16} />
                <span className="font-semibold">艺术风格汇总</span>
              </div>
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="添加新风格"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-purple-100 mt-1">选择或添加风格快速添加到提示词</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isAddingNew && (
              <div className="p-3 border-b border-gray-200 bg-purple-50">
                <input
                  type="text"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  placeholder="风格名称..."
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <input
                  type="text"
                  value={newStyleCategory}
                  onChange={(e) => setNewStyleCategory(e.target.value)}
                  placeholder="风格分类（如：现代艺术风格）..."
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNew}
                    className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewStyleName('');
                      setNewStyleCategory('');
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : (
              <div className="p-3">
                {styleCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="mb-4 last:mb-0">
                    <div className="sticky top-0 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold px-3 py-2 rounded-lg mb-2 shadow-sm">
                      {category.category}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 px-1">
                      {category.styles.map((style) => (
                        <div key={style.id} className="group relative">
                          <button
                            onClick={() => handleStyleSelect(style.name)}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-purple-200 pr-8"
                          >
                            {style.name}
                          </button>
                          {!style.is_default && (
                            <button
                              onClick={(e) => handleDelete(style.id, style.is_default, e)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                              title="删除"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
