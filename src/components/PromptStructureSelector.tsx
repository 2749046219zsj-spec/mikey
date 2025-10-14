import React, { useState, useRef, useEffect } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

interface PromptStructureSelectorProps {
  onSelectStructure: (structure: string) => void;
  buttonText?: string;
}

export const PromptStructureSelector: React.FC<PromptStructureSelectorProps> = ({
  onSelectStructure,
  buttonText = '提示词结构'
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

  const handleSelect = (structure: string) => {
    onSelectStructure(structure);
    setIsOpen(false);
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
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span className="font-semibold">提示词结构</span>
            </div>
            <p className="text-xs text-purple-100 mt-1">选择提示词结构格式</p>
          </div>

          <div className="p-3 space-y-2">
            <button
              onClick={() => handleSelect('每个提示词必须用**符号包裹，格式：**提示词内容**')}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-purple-200"
            >
              每个提示词必须用**符号包裹，格式：**提示词内容**
            </button>
            <button
              onClick={() => handleSelect('把这段话（根据我这个产品结构进行设计效果图）放在提示词最前面')}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-purple-200"
            >
              把这段话（根据我这个产品结构进行设计效果图）放在提示词最前面
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
