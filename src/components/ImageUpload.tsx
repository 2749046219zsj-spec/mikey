import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Clipboard } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void;
  images: File[];
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, images }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    onImagesChange([...images, ...imageFiles]);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      onImagesChange([...images, ...imageFiles]);
      setShowPasteHint(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'v') {
      setShowPasteHint(true);
      setTimeout(() => setShowPasteHint(false), 2000);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      onImagesChange([...images, ...imageFiles]);
      setShowPasteHint(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'v') {
      setShowPasteHint(true);
      setTimeout(() => setShowPasteHint(false), 2000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-purple-400 bg-purple-50'
            : showPasteHint
            ? 'border-green-400 bg-green-50'
            : showPasteHint
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            {isDragOver ? (
              <ImageIcon size={16} className="text-purple-600" />
            ) : showPasteHint ? (
              <Clipboard size={16} className="text-green-600" />
            ) : (
              <Upload size={16} className="text-gray-500" />
            )}
              <ImageIcon size={16} className="text-purple-600" />
            ) : showPasteHint ? (
              <Clipboard size={16} className="text-green-600" />
            ) : (
              <Upload size={16} className="text-gray-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {isDragOver 
              ? 'Drop images here' 
              : showPasteHint 
              ? 'Paste your image now!' 
              : 'Click, drag images or Ctrl+V to paste'}
              ? 'Drop images here' 
              : showPasteHint 
              ? 'Paste your image now!' 
              : 'Click, drag images or Ctrl+V to paste'}
          </p>
        </div>
      </div>
    </div>
  );
};