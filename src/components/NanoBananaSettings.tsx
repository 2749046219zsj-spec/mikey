import React, { useState } from 'react';
import { Settings, X, Image as ImageIcon, Globe } from 'lucide-react';

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

export const NanoBananaSettings: React.FC<NanoBananaSettingsProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (updates: Partial<NanoBananaConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleAspectRatioChange = (ratio: string) => {
    updateConfig({ aspectRatio: ratio });
  };

  const handleWebSearchToggle = () => {
    updateConfig({ webSearch: !config.webSearch });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        title="Nano Banana Pro 设置"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">
          {config.aspectRatio} • {config.webSearch ? '网络搜索' : '标准模式'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                Nano Banana Pro 设置
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  纵横比 (Aspect Ratio)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {aspectRatios.slice(0, 3).map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => handleAspectRatioChange(ratio.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        config.aspectRatio === ratio.value
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {aspectRatios.slice(3, 6).map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => handleAspectRatioChange(ratio.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        config.aspectRatio === ratio.value
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {aspectRatios.slice(6).map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => handleAspectRatioChange(ratio.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        config.aspectRatio === ratio.value
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Web Search Toggle */}
              <div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                      <Globe size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">启用网络搜索</h4>
                      <p className="text-xs text-gray-600">启用网络搜索和实时信息访问</p>
                    </div>
                  </div>
                  <button
                    onClick={handleWebSearchToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.webSearch ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.webSearch ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>提示：</strong>这些设置仅在使用 Nano Banana Pro 模型时生效。纵横比会影响生成图像的尺寸比例，网络搜索可以让模型访问最新的在线信息。
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
