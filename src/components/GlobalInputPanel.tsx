import React, { useState, useCallback, useEffect } from 'react';
import { ChevronUp, X, Send, Upload, Image as ImageIcon } from 'lucide-react';
import { ProductSelector } from './ProductSelector';
import { CraftSelector } from './CraftSelector';
import { StylePresetDropdown } from './StylePresetDropdown';
import { ImageUpload } from './ImageUpload';

interface GlobalInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: GenerationParams) => void;
  initialPrompt?: string;
  initialStyle?: string;
  initialReferenceImageUrl?: string;
}

export interface GenerationParams {
  prompt: string;
  product: string;
  style: string;
  craft: string;
  imageCount: number;
  uploadedImages: File[];
}

export const GlobalInputPanel: React.FC<GlobalInputPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPrompt,
  initialStyle,
  initialReferenceImageUrl
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('perfume_bottle');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedCraft, setSelectedCraft] = useState('');
  const [imageCount, setImageCount] = useState(3);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt || '');
      setSelectedStyle(initialStyle || '');

      if (initialReferenceImageUrl) {
        fetch(initialReferenceImageUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'reference.jpg', { type: blob.type });
            setUploadedImages([file]);
          })
          .catch(console.error);
      }
    }
  }, [isOpen, initialPrompt, initialStyle, initialReferenceImageUrl]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim()) {
      return;
    }

    onSubmit({
      prompt,
      product: selectedProduct,
      style: selectedStyle,
      craft: selectedCraft,
      imageCount,
      uploadedImages
    });

    setPrompt('');
    onClose();
  }, [prompt, selectedProduct, selectedStyle, selectedCraft, imageCount, uploadedImages, onSubmit, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImagesChange = useCallback((images: File[]) => {
    setUploadedImages(images);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[100] animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
        <div
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">AI 图片生成配置</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors"
              aria-label="关闭"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap gap-3 items-center animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">产品:</span>
                <ProductSelector
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">风格:</span>
                <StylePresetDropdown
                  selectedStyle={selectedStyle}
                  onStyleSelect={setSelectedStyle}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">工艺:</span>
                <CraftSelector
                  selectedCraft={selectedCraft}
                  onCraftSelect={setSelectedCraft}
                />
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/30">
                <span className="text-sm text-gray-300">款式数量:</span>
                <input
                  type="number"
                  value={imageCount}
                  onChange={e => setImageCount(Math.max(1, Math.min(9, Number(e.target.value))))}
                  min={1}
                  max={9}
                  className="w-16 px-2 py-1 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => setImageCount(prev => Math.min(9, prev + 1))}
                  className="text-emerald-400 hover:text-emerald-300"
                  aria-label="增加数量"
                >
                  ▲
                </button>
              </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <ImageUpload
                images={uploadedImages}
                onImagesChange={handleImagesChange}
                maxImages={5}
              />
            </div>

            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息或选择上方工具..."
                className="w-full px-4 py-3 pr-16 bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                rows={3}
              />

              <button
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="absolute right-3 bottom-3 w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="发送"
              >
                <Send size={20} className="text-white" />
              </button>
            </div>

            <p className="text-sm text-gray-400 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              按 Enter 发送，Shift+Enter 换行
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
