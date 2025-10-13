import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown, Sparkles } from 'lucide-react';
import { stylePresets } from '../data/stylePresets';

interface StylePresetDropdownProps {
  onSelectStyle: (style: string) => void;
  buttonText?: string;
}

export const StylePresetDropdown: React.FC<StylePresetDropdownProps> = ({
  onSelectStyle,
  buttonText = '风格预设'
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

  const handleStyleSelect = (style: string) => {
    onSelectStyle(style);
    setIsOpen(false);
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
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-[32rem] overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Palette size={16} />
              <span className="font-semibold">艺术风格汇总</span>
            </div>
            <p className="text-xs text-purple-100 mt-1">选择风格快速添加到提示词</p>
          </div>

          <div className="overflow-y-auto max-h-[28rem] p-3">
            {stylePresets.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-4 last:mb-0">
                <div className="sticky top-0 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold px-3 py-2 rounded-lg mb-2 shadow-sm">
                  {category.name}
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  {category.styles.map((style, styleIndex) => (
                    <button
                      key={styleIndex}
                      onClick={() => handleStyleSelect(style)}
                      className="text-left px-3 py-2 text-xs text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-700 rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-purple-200"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
