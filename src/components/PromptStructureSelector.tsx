import React, { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown, Plus, X } from 'lucide-react';
import { promptStructureService, PromptStructureOption } from '../lib/supabase';

interface PromptStructureSelectorProps {
  onSelectStructure: (structure: string) => void;
  buttonText?: string;
}

export const PromptStructureSelector: React.FC<PromptStructureSelectorProps> = ({
  onSelectStructure,
  buttonText = '用户提示词预设'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [structureOptions, setStructureOptions] = useState<PromptStructureOption[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStructures();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewOptionText('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadStructures = async () => {
    try {
      setIsLoading(true);
      const data = await promptStructureService.getAll();
      setStructureOptions(data);
    } catch (error) {
      console.error('Failed to load structures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (structure: string) => {
    onSelectStructure(structure);
    setIsOpen(false);
    setIsAddingNew(false);
  };

  const handleAddNew = async () => {
    if (!newOptionText.trim()) return;

    try {
      await promptStructureService.create(newOptionText.trim());
      setNewOptionText('');
      setIsAddingNew(false);
      await loadStructures();
    } catch (error) {
      console.error('Failed to add structure:', error);
    }
  };

  const handleDelete = async (id: string, isDefault: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDefault) return;

    try {
      await promptStructureService.delete(id);
      await loadStructures();
    } catch (error) {
      console.error('Failed to delete structure:', error);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:border-purple-400 hover:shadow-md rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5 transition-all"
      >
        <FileText size={14} className="text-purple-500" />
        <span>{buttonText}</span>
        <ChevronDown size={12} className={`text-purple-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 flex flex-col">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span className="font-semibold">提示词结构</span>
              </div>
              <button
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="添加新结构"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-purple-100 mt-1">选择或添加提示词结构格式</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isAddingNew && (
              <div className="p-3 border-b border-gray-200 bg-purple-50">
                <textarea
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  placeholder="输入新的提示词结构选项..."
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAddNew}
                    className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewOptionText('');
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
              <div className="p-3 space-y-2">
                {structureOptions.map((option) => (
                  <div
                    key={option.id}
                    className="group relative"
                  >
                    <button
                      onClick={() => handleSelect(option.option_text)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-purple-200 pr-10"
                    >
                      {option.option_text}
                    </button>
                    {!option.is_default && (
                      <button
                        onClick={(e) => handleDelete(option.id, option.is_default, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="删除"
                      >
                        <X size={14} />
                      </button>
                    )}
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
