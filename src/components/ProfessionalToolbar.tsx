import React, { useState } from 'react';
import { FileText, Images } from 'lucide-react';
import { StylePresetDropdown } from './StylePresetDropdown';
import { CraftSelector } from './CraftSelector';
import { ProductSelector } from './ProductSelector';
import { PromptStructureSelector } from './PromptStructureSelector';

interface ProfessionalToolbarProps {
  onStyleSelect: (style: string) => void;
  onCraftsConfirm: (crafts: string[]) => void;
  onProductSelect: (product: { name: string; template: string }) => void;
  onStructureSelect: (structure: string) => void;
  onOpenPromptUpload: () => void;
  onOpenReferenceLibrary: () => void;
  styleCount: number;
  onStyleCountChange: (count: number) => void;
  selectedReferenceCount: number;
}

export const ProfessionalToolbar: React.FC<ProfessionalToolbarProps> = ({
  onStyleSelect,
  onCraftsConfirm,
  onProductSelect,
  onStructureSelect,
  onOpenPromptUpload,
  onOpenReferenceLibrary,
  styleCount,
  onStyleCountChange,
  selectedReferenceCount
}) => {
  return (
    <div className="border-t border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 py-3">
      <div className="max-w-4xl mx-auto px-4">
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
                const value = parseInt(e.target.value) || 3;
                const newCount = Math.max(1, Math.min(50, value));
                onStyleCountChange(newCount);
              }}
              className="w-12 px-1.5 py-0.5 text-sm text-center border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
            />
            <span className="text-xs text-gray-600">个</span>
          </div>

          <PromptStructureSelector onSelectStructure={onStructureSelect} buttonText="用户提示词自定义" />

          <button
            onClick={onOpenPromptUpload}
            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <FileText size={14} />
            提示词上传
          </button>

          <button
            onClick={onOpenReferenceLibrary}
            className={`px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1.5 ${
              selectedReferenceCount > 0
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white ring-2 ring-green-300 animate-pulse-subtle'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
            }`}
          >
            <Images size={14} />
            参考图库
            {selectedReferenceCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/30 rounded-full text-[10px] font-bold">
                {selectedReferenceCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
