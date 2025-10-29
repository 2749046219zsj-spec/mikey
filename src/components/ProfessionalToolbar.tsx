import React, { useState } from 'react';
import { FileText, Images, Wrench, ExternalLink } from 'lucide-react';
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

const tools = [
  {
    id: 'sku-manager',
    name: '货号管理',
    url: 'https://automated-image-sku-d3hn.bolt.host/',
    description: '自动化图片货号管理工具'
  }
];

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
  const [showToolbox, setShowToolbox] = useState(false);

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

          <div className="relative">
            <button
              onClick={() => setShowToolbox(!showToolbox)}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <Wrench size={14} />
              工具箱
            </button>

            {showToolbox && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowToolbox(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2">
                    <h3 className="text-sm font-semibold text-white">专业工具箱</h3>
                  </div>
                  <div className="p-2">
                    {tools.map((tool) => (
                      <a
                        key={tool.id}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
                            {tool.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {tool.description}
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-gray-400 group-hover:text-amber-600 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
