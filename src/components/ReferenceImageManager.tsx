import React, { useState, useEffect } from 'react';
import { Upload, X, Check, Trash2, Loader2 } from 'lucide-react';
import { ReferenceImageService } from '../services/referenceImageService';
import type { ReferenceImage } from '../types/referenceImage';
import { useAuth } from '../contexts/AuthContext';

interface ReferenceImageManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedImages: string[];
  onImagesSelect: (imageUrls: string[]) => void;
  multiSelect?: boolean;
}

const ReferenceImageManager = React.memo<ReferenceImageManagerProps>(
  ({ isOpen, onClose, selectedImages, onImagesSelect, multiSelect = true }) => {
    const { user } = useAuth();
    const [images, setImages] = useState<ReferenceImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>(selectedImages);

    useEffect(() => {
      if (isOpen && user) {
        loadImages();
      }
    }, [isOpen, user]);

    useEffect(() => {
      setSelectedIds(selectedImages);
    }, [selectedImages]);

    const loadImages = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const data = await ReferenceImageService.getUserReferenceImages(user.id);
        setImages(data);
      } catch (error) {
        console.error('Failed to load images:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user || !e.target.files || e.target.files.length === 0) return;

      const files = Array.from(e.target.files);
      setUploading(true);

      try {
        for (const file of files) {
          if (!file.type.startsWith('image/')) {
            alert(`${file.name} 不是图片文件`);
            continue;
          }

          if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} 超过 5MB 限制`);
            continue;
          }

          const newImage = await ReferenceImageService.uploadReferenceImage(user.id, file);
          setImages(prev => [newImage, ...prev]);
        }
      } catch (error) {
        console.error('Failed to upload images:', error);
        alert('上传失败，请重试');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };

    const handleDelete = async (image: ReferenceImage) => {
      if (!confirm(`确定要删除 ${image.file_name} 吗？`)) return;

      try {
        await ReferenceImageService.deleteReferenceImage(image.id, image.image_url);
        setImages(prev => prev.filter(img => img.id !== image.id));
        setSelectedIds(prev => prev.filter(id => id !== image.image_url));
      } catch (error) {
        console.error('Failed to delete image:', error);
        alert('删除失败，请重试');
      }
    };

    const handleImageClick = (imageUrl: string) => {
      if (multiSelect) {
        setSelectedIds(prev =>
          prev.includes(imageUrl)
            ? prev.filter(id => id !== imageUrl)
            : [...prev, imageUrl]
        );
      } else {
        setSelectedIds([imageUrl]);
      }
    };

    const handleConfirm = () => {
      onImagesSelect(selectedIds);
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">参考图预设</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <label className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-all">
                <Upload className="w-5 h-5" />
                <span className="font-medium">
                  {uploading ? '上传中...' : '上传参考图'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2 text-center">
                支持 JPG、PNG、GIF，单个文件最大 5MB
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Upload className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>还没有参考图，上传第一张吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map(image => {
                  const isSelected = selectedIds.includes(image.image_url);
                  return (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => handleImageClick(image.image_url)}
                    >
                      <div className="aspect-square">
                        <img
                          src={image.image_url}
                          alt={image.file_name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(image);
                        }}
                        className="absolute top-2 left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate">{image.file_name}</p>
                        <p className="text-gray-300">
                          {(image.file_size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              已选择 {selectedIds.length} 张图片
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReferenceImageManager.displayName = 'ReferenceImageManager';

export default ReferenceImageManager;
