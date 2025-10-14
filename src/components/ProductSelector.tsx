import React, { useState, useRef, useEffect } from 'react';
import { Package, ChevronDown, Plus, X, Edit2, Check } from 'lucide-react';
import { productOptionsService, ProductOption } from '../lib/supabase';

interface ProductSelectorProps {
  onSelectProduct: (product: string) => void;
  buttonText?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onSelectProduct,
  buttonText = '产品'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setEditingId(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadOptions = async () => {
    try {
      setIsLoading(true);
      const data = await productOptionsService.getAll();
      setOptions(data);
    } catch (error) {
      console.error('Failed to load options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (optionText: string) => {
    onSelectProduct(optionText);
    setIsOpen(false);
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim()) return;

    try {
      await productOptionsService.create(newOptionText);
      setNewOptionText('');
      setIsAdding(false);
      await loadOptions();
    } catch (error) {
      console.error('Failed to add option:', error);
    }
  };

  const handleDeleteOption = async (id: string, isDefault: boolean) => {
    if (isDefault) return;

    try {
      await productOptionsService.delete(id);
      await loadOptions();
    } catch (error) {
      console.error('Failed to delete option:', error);
    }
  };

  const handleEditOption = async (id: string) => {
    if (!editText.trim()) return;

    try {
      await productOptionsService.update(id, editText);
      setEditingId(null);
      setEditText('');
      await loadOptions();
    } catch (error) {
      console.error('Failed to update option:', error);
    }
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditText(currentText);
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
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Package size={16} />
              <span className="font-semibold">产品提示词</span>
            </div>
            <p className="text-xs text-purple-100 mt-1">选择产品提示词模板</p>
          </div>

          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500 text-sm">加载中...</div>
            ) : (
              <>
                {options.map((option) => (
                  <div key={option.id} className="group relative">
                    {editingId === option.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditOption(option.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelect(option.option_text)}
                          className="flex-1 text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-purple-200"
                        >
                          {option.option_text}
                        </button>
                        {!option.is_default && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditing(option.id, option.option_text)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteOption(option.id, option.is_default)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isAdding ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <input
                      type="text"
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      placeholder="输入新选项..."
                      className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <button
                      onClick={handleAddOption}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewOptionText('');
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-all border border-dashed border-purple-300 hover:border-purple-400"
                  >
                    <Plus size={16} />
                    <span>添加新选项</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
