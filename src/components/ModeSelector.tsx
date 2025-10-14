import React, { useState, useRef, useEffect } from 'react';
import { Zap, ChevronDown } from 'lucide-react';

export type GenerationMode = 'normal' | 'batch';

interface ModeSelectorProps {
  selectedMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  buttonText?: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  buttonText = '模式'
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

  const modes = [
    {
      id: 'normal' as GenerationMode,
      name: '普通模式',
      description: '单次生成图片',
      icon: '🎨'
    },
    {
      id: 'batch' as GenerationMode,
      name: '自动批量模式',
      description: '批量处理多个提示词',
      icon: '⚡'
    }
  ];

  const currentMode = modes.find(m => m.id === selectedMode);

  const handleModeSelect = (mode: GenerationMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 hover:border-blue-400 hover:shadow-md rounded-lg text-sm text-gray-700 font-medium flex items-center gap-1.5 transition-all"
      >
        <Zap size={14} className="text-blue-500" />
        <span>{currentMode?.icon} {buttonText}</span>
        <ChevronDown size={12} className={`text-blue-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap size={16} />
              <span className="font-semibold">生成模式</span>
            </div>
            <p className="text-xs text-blue-100 mt-1">选择图片生成模式</p>
          </div>

          <div className="p-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all mb-1 last:mb-0 ${
                  selectedMode === mode.id
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-400 shadow-sm'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl mt-0.5">{mode.icon}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      selectedMode === mode.id ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {mode.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {mode.description}
                    </div>
                  </div>
                  {selectedMode === mode.id && (
                    <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
