import React, { useState } from 'react';
import { Settings, X, Image as ImageIcon } from 'lucide-react';

export interface SeedreamConfig {
  resolution: '2K' | '4K';
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | '2:3' | '3:2' | '21:9';
  customWidth?: number;
  customHeight?: number;
  useCustomSize: boolean;
  sequentialMode: 'off' | 'auto' | 'storybook' | 'comic';
  imageCount: number;
}

interface SeedreamSettingsProps {
  config: SeedreamConfig;
  onChange: (config: SeedreamConfig) => void;
}

const aspectRatioSizes: Record<string, { width: number; height: number }> = {
  '1:1': { width: 2048, height: 2048 },
  '3:4': { width: 1728, height: 2304 },
  '4:3': { width: 2304, height: 1728 },
  '16:9': { width: 2560, height: 1440 },
  '9:16': { width: 1440, height: 2560 },
  '2:3': { width: 1728, height: 2592 },
  '3:2': { width: 2592, height: 1728 },
  '21:9': { width: 2560, height: 1097 }
};

export const SeedreamSettings: React.FC<SeedreamSettingsProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (updates: Partial<SeedreamConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleAspectRatioChange = (ratio: SeedreamConfig['aspectRatio']) => {
    const size = aspectRatioSizes[ratio];
    updateConfig({
      aspectRatio: ratio,
      customWidth: size.width,
      customHeight: size.height
    });
  };

  const currentSize = config.useCustomSize
    ? `${config.customWidth}x${config.customHeight}`
    : aspectRatioSizes[config.aspectRatio]
    ? `${aspectRatioSizes[config.aspectRatio].width}x${aspectRatioSizes[config.aspectRatio].height}`
    : '2048x2048';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        title="Seedream 设置"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">
          {config.resolution} • {config.aspectRatio} • {config.sequentialMode !== 'off' ? `${config.imageCount}张` : '单张'}
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
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                Seedream 4.0 设置
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分辨率
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['2K', '4K'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => updateConfig({ resolution: res })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        config.resolution === res
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图片比例
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['1:1', '3:4', '4:3', '16:9', '9:16', '2:3', '3:2', '21:9'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => handleAspectRatioChange(ratio)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        config.aspectRatio === ratio
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Size Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  自定义尺寸
                </label>
                <button
                  onClick={() => updateConfig({ useCustomSize: !config.useCustomSize })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.useCustomSize ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.useCustomSize ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Custom Size Inputs */}
              {config.useCustomSize && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      宽度 (W)
                    </label>
                    <input
                      type="number"
                      min="512"
                      max="4096"
                      step="64"
                      value={config.customWidth || 2048}
                      onChange={(e) => updateConfig({ customWidth: parseInt(e.target.value) || 2048 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      高度 (H)
                    </label>
                    <input
                      type="number"
                      min="512"
                      max="4096"
                      step="64"
                      value={config.customHeight || 2048}
                      onChange={(e) => updateConfig({ customHeight: parseInt(e.target.value) || 2048 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Current Size Display */}
              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-xs text-gray-600">当前尺寸：</span>
                <span className="text-sm font-medium text-gray-900 ml-1">{currentSize}</span>
              </div>

              {/* Sequential Generation Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  组图模式
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'off', label: '关闭', desc: '生成单张图片' },
                    { value: 'auto', label: '自动', desc: '自动触发组图能力' },
                    { value: 'storybook', label: '故事书', desc: '根据内容创建专属绘本' },
                    { value: 'comic', label: '连环画', desc: '一句话生成动漫、连环画' }
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => updateConfig({
                        sequentialMode: mode.value as SeedreamConfig['sequentialMode'],
                        imageCount: mode.value === 'off' ? 1 : config.imageCount
                      })}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        config.sequentialMode === mode.value
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">{mode.label}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Count */}
              {config.sequentialMode !== 'off' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成数量：{config.imageCount}张
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={config.imageCount}
                    onChange={(e) => updateConfig({ imageCount: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1张</span>
                    <span>15张</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const getDefaultSeedreamConfig = (): SeedreamConfig => ({
  resolution: '2K',
  aspectRatio: '1:1',
  customWidth: 2048,
  customHeight: 2048,
  useCustomSize: false,
  sequentialMode: 'off',
  imageCount: 1
});
