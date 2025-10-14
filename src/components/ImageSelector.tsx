import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, ImageIcon, Upload, Clipboard } from 'lucide-react';
import { useImageSelector } from '../hooks/useImageSelector';
import { useImageGallery } from '../hooks/useImageGallery';

export const ImageSelector: React.FC = () => {
  const {
    isOpen,
    prompts,
    selectedImageUrl,
    selectedImageFile,
    onConfirm,
    closeSelector,
    selectImage,
    selectUploadedImage
  } = useImageSelector();

  const { images } = useImageGallery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSelector();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeSelector]);

  const handleConfirm = async () => {
    if (selectedImageFile && onConfirm) {
      onConfirm(selectedImageFile);
      closeSelector();
    } else if (selectedImageUrl && onConfirm) {
      try {
        const response = await fetch(selectedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'reference_image.jpg', { type: blob.type });
        onConfirm(file);
        closeSelector();
      } catch (error) {
        console.error('Failed to convert image:', error);
        alert('图片加载失败，请重试');
      }
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      selectUploadedImage(file);
    } else {
      alert('请选择图片文件');
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          selectUploadedImage(file);
          return;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
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

        <div className="flex-1 overflow-y-auto p-6" onPaste={handlePaste} tabIndex={0}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          <div
            ref={uploadAreaRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mb-6 border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex gap-4 mb-3">
                <Upload size={32} className="text-gray-400" />
                <Clipboard size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 font-medium mb-1">
                上传本地图片或粘贴复制的图片
              </p>
              <p className="text-xs text-gray-500">
                点击上传、拖拽图片到此处，或使用 Ctrl+V 粘贴
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                选择文件
              </button>
            </div>
          </div>

          {selectedImageUrl && selectedImageFile && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">已选择的图片</h3>
              <div className="relative group w-48 rounded-lg overflow-hidden ring-4 ring-green-500 shadow-lg">
                <img
                  src={selectedImageUrl}
                  alt="Selected"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-2 right-2">
                  <CheckCircle2 size={24} className="text-green-600 bg-white rounded-full" />
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                  已上传
                </div>
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">或从图库选择</h3>
              <div className="grid grid-cols-4 gap-4">
                {images.map((imageUrl, index) => {
                  const isSelected = selectedImageUrl === imageUrl && !selectedImageFile;
                  return (
                    <div
                      key={index}
                      onClick={() => selectImage(imageUrl)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        isSelected
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
                        isSelected
                          ? 'bg-blue-500/20'
                          : 'bg-black/0 group-hover:bg-black/10'
                      }`} />

                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 size={24} className="text-blue-600 bg-white rounded-full" />
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                        #{index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
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
