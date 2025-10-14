import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';

interface PromptPreset {
  id: string;
  name: string;
  description: string;
}

const promptPresets: PromptPreset[] = [
  {
    id: 'luxury-brand',
    name: '奢华品牌系列',
    description: '高端奢华品牌定位，强调尊贵与精致'
  },
  {
    id: 'young-fashion',
    name: '年轻时尚系列',
    description: '面向年轻消费群体，时尚前卫设计'
  },
  {
    id: 'natural-fresh',
    name: '自然清新系列',
    description: '天然清新风格，强调环保与纯净'
  },
  {
    id: 'artistic-creative',
    name: '艺术创意系列',
    description: '艺术感强烈，独特创意设计'
  },
  {
    id: 'classic-elegant',
    name: '经典优雅系列',
    description: '经典传统设计，优雅永恒'
  },
  {
    id: 'minimalist-modern',
    name: '极简现代系列',
    description: '现代极简风格，简约而不简单'
  }
];

interface PromptPresetSelectorProps {
  onSelectPreset: (preset: PromptPreset) => void;
  buttonText?: string;
}

export const PromptPresetSelector: React.FC<PromptPresetSelectorProps> = ({
  onSelectPreset,
  buttonText = '生成提示词'
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

  const handlePresetClick = (preset: PromptPreset) => {
    onSelectPreset(preset);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs rounded-lg hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-1.5"
      >
        <Sparkles size={14} />
        {buttonText}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-600" />
              <h3 className="font-medium text-sm text-gray-800">选择提示词生成场景</h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">点击选项生成对应场景的AI提示词</p>
          </div>

          <div className="p-2">
            {promptPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className="w-full text-left px-3 py-2.5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 rounded-lg transition-colors group"
              >
                <div className="font-medium text-sm text-gray-800 group-hover:text-orange-600">
                  {preset.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
