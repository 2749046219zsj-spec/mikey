import React, { useState, useRef, useEffect } from 'react';
import { Wrench, ChevronDown, Check, Plus, X } from 'lucide-react';
import { craftOptionsService, CraftOption } from '../lib/supabase';

interface CraftSelectorProps {
  onConfirm: (selectedCrafts: string[]) => void;
  buttonText?: string;
}

export const CraftSelector: React.FC<CraftSelectorProps> = ({
  onConfirm,
  buttonText = '工艺'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([]);
  const [craftOptions, setCraftOptions] = useState<CraftOption[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCraftName, setNewCraftName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCrafts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewCraftName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadCrafts = async () => {
    try {
      setIsLoading(true);
      const data = await craftOptionsService.getAll();
      setCraftOptions(data);
    } catch (error) {
      console.error('Failed to load crafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCraft = (craft: string) => {
    setSelectedCrafts(prev => {
      if (prev.includes(craft)) {
        return prev.filter(c => c !== craft);
      } else {
        return [...prev, craft];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedCrafts.length > 0) {
      onConfirm(selectedCrafts);
      setSelectedCrafts([]);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedCrafts([]);
  };

  const handleAddNew = async () => {
    if (!newCraftName.trim()) return;

    try {
      await craftOptionsService.create(newCraftName.trim());
      setNewCraftName('');
      setIsAddingNew(false);
      await loadCrafts();
    } catch (error) {
      console.error('Failed to add craft:', error);
    }
  };

  const handleDelete = async (id: string, isDefault: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDefault) return;

    try {
      await craftOptionsService.delete(id);
      setSelectedCrafts(prev => prev.filter(c => c !== craftOptions.find(co => co.id === id)?.name));
      await loadCrafts();
    } catch (error) {
      console.error('Failed to delete craft:', error);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:border-purple-400 hover:shadow-md rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5 transition-all"
      >
        <Wrench size={14} className="text-purple-500" />
        <span>{buttonText}</span>
        {selectedCrafts.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
            {selectedCrafts.length}
          </span>
        )}
        <ChevronDown size={12} className={`text-purple-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[32rem] flex flex-col">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={16} />
                <span className="font-semibold">工艺分类汇总</span>
              </div>
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="添加新工艺"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-purple-100 mt-1">可多选工艺，点击确认添加</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isAddingNew && (
              <div className="p-3 border-b border-gray-200 bg-purple-50">
                <input
                  type="text"
                  value={newCraftName}
                  onChange={(e) => setNewCraftName(e.target.value)}
                  placeholder="输入新工艺名称..."
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
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
                      setNewCraftName('');
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
                <div className="grid grid-cols-3 gap-2">
                  {craftOptions.map((craft) => {
                    const isSelected = selectedCrafts.includes(craft.name);
                    return (
                      <div key={craft.id} className="group relative">
                        <button
                          onClick={() => toggleCraft(craft.name)}
                          className={`relative w-full px-3 py-2 text-sm text-center rounded-lg transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-600 shadow-md'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          {craft.name}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </button>
                        {!craft.is_default && !isSelected && (
                          <button
                            onClick={(e) => handleDelete(craft.id, craft.is_default, e)}
                            className="absolute -top-1 -right-1 p-1 text-white bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                            title="删除"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
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
              disabled={selectedCrafts.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
            >
              确认 {selectedCrafts.length > 0 && `(${selectedCrafts.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
