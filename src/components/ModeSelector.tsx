import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Image, MessageCircle, CheckCircle } from 'lucide-react';

export type AppMode = 'image-generation' | 'customer-service';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

interface ModeOption {
  id: AppMode;
  label: string;
  icon: React.ReactNode;
}

const modeOptions: ModeOption[] = [
  { id: 'image-generation', label: '图片生成', icon: <Image size={18} /> },
  { id: 'customer-service', label: '客服助手', icon: <MessageCircle size={18} /> }
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModeOption = modeOptions.find(option => option.id === currentMode);

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

  const handleModeSelect = (mode: AppMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {currentModeOption?.icon}
        <span className="font-medium">{currentModeOption?.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
            创作类型
          </div>
          {modeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleModeSelect(option.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                currentMode === option.id ? 'bg-teal-50' : ''
              }`}
            >
              <div className={`flex-shrink-0 ${
                currentMode === option.id ? 'text-teal-600' : 'text-gray-600'
              }`}>
                {option.icon}
              </div>
              <span className={`flex-1 text-left text-sm font-medium ${
                currentMode === option.id ? 'text-teal-700' : 'text-gray-700'
              }`}>
                {option.label}
              </span>
              {currentMode === option.id && (
                <CheckCircle size={16} className="text-teal-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
