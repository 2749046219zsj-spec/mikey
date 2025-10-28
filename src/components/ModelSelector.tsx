import React from 'react';
import { Bot, Zap, Sparkles } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
  currentMode?: 'normal' | 'professional';
}

const models = [
  {
    id: 'Gemini-2.5-Flash-Image',
    name: 'Gemini 2.5 Flash',
    description: 'Fast image analysis',
    icon: Bot,
    color: 'from-purple-500 to-blue-600'
  },
  {
    id: 'Seedream-4.0',
    name: 'Seedream 4.0',
    description: 'AI image generation',
    icon: Sparkles,
    color: 'from-pink-500 to-orange-500'
  }
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false,
  currentMode = 'normal'
}) => {
  // 在专业模式下过滤掉 Seedream 4.0
  const availableModels = currentMode === 'professional'
    ? models.filter(m => m.id !== 'Seedream-4.0')
    : models;

  return (
    <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
      {availableModels.map((model) => {
        const Icon = model.icon;
        const isSelected = selectedModel === model.id;
        
        return (
          <button
            key={model.id}
            onClick={() => onModelChange(model.id)}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isSelected
                ? `bg-gradient-to-r ${model.color} text-white shadow-md`
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isSelected ? 'bg-white/20' : `bg-gradient-to-r ${model.color}`
            }`}>
              <Icon size={12} className={isSelected ? 'text-white' : 'text-white'} />
            </div>
            <div className="text-left">
              <div className="font-medium">{model.name}</div>
              <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                {model.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};