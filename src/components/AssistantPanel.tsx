import React, { useState } from 'react';
import { Images } from 'lucide-react';
import { ProductSelector } from './ProductSelector';
import { StylePresetDropdown } from './StylePresetDropdown';
import { CraftSelector } from './CraftSelector';
import { PromptStructureSelector } from './PromptStructureSelector';

interface AssistantPanelProps {
  onProductSelect: (product: string) => void;
  onStyleSelect: (style: string) => void;
  onCraftsConfirm: (crafts: string[]) => void;
  onStructureSelect: (structure: string) => void;
  styleCount: number;
  onStyleCountChange: (count: number) => void;
  selectedReferenceImages: any[];
  onOpenReferenceLibrary: () => void;
  onClearChat?: () => void;
  hasMessages?: boolean;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  onProductSelect,
  onStyleSelect,
  onCraftsConfirm,
  onStructureSelect,
  styleCount,
  onStyleCountChange,
  selectedReferenceImages,
  onOpenReferenceLibrary,
  onClearChat,
  hasMessages = false
}) => {
  return (
    <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <ProductSelector onSelectProduct={onProductSelect} buttonText="产品" />
          <StylePresetDropdown onSelectStyle={onStyleSelect} buttonText="风格" />
          <CraftSelector onConfirm={onCraftsConfirm} buttonText="工艺" />

          <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <span className="text-xs text-gray-700 font-medium">款式数量:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={styleCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                const newCount = Math.max(1, Math.min(20, value));
                onStyleCountChange(newCount);
              }}
              className="w-12 px-1.5 py-0.5 text-sm text-center border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
            />
            <span className="text-xs text-gray-600">个</span>
          </div>

          <PromptStructureSelector onSelectStructure={onStructureSelect} buttonText="用户提示词自定义" />

          <button
            onClick={onOpenReferenceLibrary}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1"
          >
            <Images size={14} />
            参考图库
            {selectedReferenceImages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
                {selectedReferenceImages.length}
              </span>
            )}
          </button>

          {hasMessages && onClearChat && (
            <button
              onClick={onClearChat}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              清空对话
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
