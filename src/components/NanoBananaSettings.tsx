import React from 'react';
import { Settings, Globe } from 'lucide-react';

export interface NanoBananaConfig {
  aspectRatio?: string;
  webSearch?: boolean;
}

export const getDefaultNanoBananaConfig = (): NanoBananaConfig => ({
  aspectRatio: '1:1',
  webSearch: false,
});

interface NanoBananaSettingsProps {
  config: NanoBananaConfig;
  onChange: (config: NanoBananaConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const aspectRatios = [
  { value: '21:9', label: '21:9' },
  { value: '16:9', label: '16:9' },
  { value: '3:2', label: '3:2' },
  { value: '4:3', label: '4:3' },
  { value: '5:4', label: '5:4' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '3:4', label: '3:4' },
  { value: '2:3', label: '2:3' },
  { value: '9:16', label: '9:16' },
];

export const NanoBananaSettings: React.FC<NanoBananaSettingsProps> = ({
  config,
  onChange,
  isOpen,
  onToggle,
}) => {
  const handleAspectRatioChange = (ratio: string) => {
    onChange({
      ...config,
      aspectRatio: ratio,
    });
  };

  const handleWebSearchToggle = () => {
    onChange({
      ...config,
      webSearch: !config.webSearch,
    });
  };

  return (
    <div className="border-t border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-blue-600" />
          <span className="font-medium text-gray-700">Nano Banana Pro 设置</span>
        </div>
        <span className="text-xs text-gray-500">
          {isOpen ? '收起' : '展开'}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 bg-white space-y-6">
          {/* Aspect Ratio Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              纵横比 (Aspect Ratio)
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    config.aspectRatio === ratio.value
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {/* Web Search Section */}
          <div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Globe size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">启用网络搜索</h3>
                  <p className="text-xs text-gray-600">
                    启用网络搜索和实时信息访问
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.webSearch || false}
                  onChange={handleWebSearchToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>提示：</strong>这些设置仅在使用 Nano Banana Pro 模型时生效。纵横比会影响生成图像的尺寸比例，网络搜索可以让模型访问最新的在线信息。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
