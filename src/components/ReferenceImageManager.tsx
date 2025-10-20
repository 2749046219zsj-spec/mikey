import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Check, Trash2, Loader2, Link, HardDrive } from 'lucide-react';
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

type UploadMode = 'file' | 'url' | 'external';

const ReferenceImageManager = React.memo<ReferenceImageManagerProps>(
  ({ isOpen, onClose, selectedImages, onImagesSelect, multiSelect = true }) => {
    const { user } = useAuth();
    const [images, setImages] = useState<ReferenceImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>(selectedImages);
    const [uploadMode, setUploadMode] = useState<UploadMode>('file');
    const [imageUrl, setImageUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isOpen && user) {
        loadImages();
      }
    }, [isOpen, user]);

    useEffect(() => {
      setSelectedIds(selectedImages);
    }, [selectedImages]);

    useEffect(() => {
      if (isOpen && uploadMode === 'file') {
        const handlePaste = async (e: ClipboardEvent) => {
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
            e.preventDefault();
            await handleFilesUpload(imageFiles);
          }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
      }
    }, [isOpen, uploadMode, user]);

    const loadImages = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const data = await ReferenceImageService.getUserReferenceImages(user.id);
        setImages(data);
      } catch (error) {
        console.error('Failed to load images:', error);
        setErrorMessage('加载图片失败');
      } finally {
        setLoading(false);
      }
    };

    const handleFilesUpload = async (files: File[]) => {
      if (!user) return;

      setUploading(true);
      setErrorMessage('');

      try {
        for (const file of files) {
          if (!file.type.startsWith('image/')) {
            setErrorMessage(`${file.name} 不是图片文件`);
            continue;
          }

          if (file.size > 5 * 1024 * 1024) {
            setErrorMessage(`${file.name} 超过 5MB 限制`);
            continue;
          }

          const newImage = await ReferenceImageService.uploadReferenceImage(user.id, file);
          setImages(prev => [newImage, ...prev]);
        }
        setErrorMessage('');
      } catch (error: any) {
        console.error('Failed to upload images:', error);
        setErrorMessage(error.message || '上传失败，请重试');
      } finally {
        setUploading(false);
      }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const files = Array.from(e.target.files);
      await handleFilesUpload(files);
      e.target.value = '';
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === dropZoneRef.current) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      );

      if (files.length > 0) {
        await handleFilesUpload(files);
      }
    };

    const handleUrlUpload = async () => {
      if (!user || !imageUrl.trim()) {
        setErrorMessage('请输入图片链接');
        return;
      }

      setUploading(true);
      setErrorMessage('');

      try {
        let newImage: ReferenceImage;

        if (uploadMode === 'url') {
          newImage = await ReferenceImageService.uploadFromUrl(user.id, imageUrl);
        } else {
          newImage = await ReferenceImageService.saveExternalUrl(user.id, imageUrl);
        }

        setImages(prev => [newImage, ...prev]);
        setImageUrl('');
      } catch (error: any) {
        console.error('Failed to upload from URL:', error);
        setErrorMessage(error.message || 'URL 上传失败');
      } finally {
        setUploading(false);
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
        setErrorMessage('删除失败，请重试');
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
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    uploadMode === 'file'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  本地上传
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    uploadMode === 'url'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  URL 上传
                </button>
                <button
                  onClick={() => setUploadMode('external')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    uploadMode === 'external'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  外部链接
                </button>
              </div>

              {uploadMode === 'file' ? (
                <>
                  <div
                    ref={dropZoneRef}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileInputChange}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} />
                    <p className="text-base font-medium text-gray-700 mb-1">
                      {uploading ? '上传中...' : 'Click, drag images or Ctrl+V to paste'}
                    </p>
                    <p className="text-xs text-gray-500">
                      支持 JPG、PNG、GIF，单个文件最大 5MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder={uploadMode === 'url' ? '输入图片链接（将下载到服务器）' : '输入图片链接（仅保存链接）'}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={uploading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && imageUrl.trim()) {
                          handleUrlUpload();
                        }
                      }}
                    />
                    <button
                      onClick={handleUrlUpload}
                      disabled={!imageUrl.trim() || uploading}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          上传中
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          {uploadMode === 'url' ? '下载并上传' : '保存链接'}
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {uploadMode === 'url'
                      ? '图片将被下载并保存到服务器'
                      : '仅保存图片链接，不下载到服务器（需确保链接长期有效）'}
                  </p>
                </>
              )}

              {errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-700">已上传的图片</h3>
                <span className="text-sm text-gray-500">已选择 {selectedIds.length} 张</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Upload className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">还没有参考图，上传第一张吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {images.map(image => {
                  const isSelected = selectedIds.includes(image.image_url);
                  const isExternal = image.mime_type === 'image/external';

                  return (
                    <div
                      key={image.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 shadow-lg ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                      }`}
                      onClick={() => handleImageClick(image.image_url)}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={image.image_url}
                          alt={image.file_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3E加载失败%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>

                      {isExternal && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 rounded text-white text-xs">
                          外链
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-3 h-3 text-white font-bold" />
                        </div>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(image);
                        }}
                        className={`absolute ${isExternal ? 'top-7' : 'top-1'} left-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg`}
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="truncate text-xs">{image.file_name}</p>
                        {image.file_size > 0 && (
                          <p className="text-gray-300 text-xs">
                            {(image.file_size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600 font-medium">
              已选择 <span className="text-orange-500 font-bold">{selectedIds.length}</span> 张图片
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                确认选择 ({selectedIds.length})
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
