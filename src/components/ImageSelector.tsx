import React, { useEffect } from 'react';
import { X, CheckCircle2, ImageIcon } from 'lucide-react';
import { useImageSelector } from '../hooks/useImageSelector';
import { useImageGallery } from '../hooks/useImageGallery';

export const ImageSelector: React.FC = () => {
  const {
    isOpen,
    prompts,
    selectedImageUrl,
    onConfirm,
    closeSelector,
    selectImage
  } = useImageSelector();

  const { images } = useImageGallery();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSelector();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeSelector]);

  const handleConfirm = () => {
    if (selectedImageUrl && onConfirm) {
      onConfirm(selectedImageUrl);
      closeSelector();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">选择参考图</h2>
            <p className="text-sm text-gray-500 mt-1">
              将发送 <span className="font-medium text-blue-600">{prompts.length}</span> 个提示词到主界面，请选择一张参考图
            </p>
          </div>
          <button
            onClick={closeSelector}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <ImageIcon size={64} className="mb-4" />
              <p className="text-lg font-medium">图库中暂无图片</p>
              <p className="text-sm mt-2">请先在主界面生成一些图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {images.map((imageUrl, index) => (
                <div
                  key={index}
                  onClick={() => selectImage(imageUrl)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                    selectedImageUrl === imageUrl
                      ? 'ring-4 ring-blue-500 shadow-lg scale-105'
                      : 'hover:ring-2 hover:ring-gray-300 hover:shadow-md'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />

                  <div className={`absolute inset-0 transition-all duration-200 ${
                    selectedImageUrl === imageUrl
                      ? 'bg-blue-500/20'
                      : 'bg-black/0 group-hover:bg-black/10'
                  }`} />

                  {selectedImageUrl === imageUrl && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={24} className="text-blue-600 bg-white rounded-full" />
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={closeSelector}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedImageUrl}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:hover:shadow-md"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
};
