import React, { useState, useRef, useEffect } from 'react';
import { Wrench, ChevronDown, Check } from 'lucide-react';
import { perfumeBottleCrafts } from '../data/perfumeBottleCrafts';

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
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Wrench size={16} />
              <span className="font-semibold">香水瓶常见工艺分类汇总</span>
            </div>
            <p className="text-xs text-purple-100 mt-1">可多选工艺，点击确认添加</p>
          </div>

          <div className="overflow-y-auto max-h-96 p-3">
            <div className="grid grid-cols-3 gap-2">
              {perfumeBottleCrafts.map((craft, index) => {
                const isSelected = selectedCrafts.includes(craft);
                return (
                  <button
                    key={index}
                    onClick={() => toggleCraft(craft)}
                    className={`relative px-3 py-2 text-sm text-center rounded-lg transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    {craft}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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
