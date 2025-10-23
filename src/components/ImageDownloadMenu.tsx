import React, { useState, useRef, useEffect } from 'react';
import { Download, Save, HardDrive } from 'lucide-react';
import { savedImageService } from '../services/savedImageService';

interface ImageDownloadMenuProps {
  imageUrl: string;
  prompt?: string;
  onSaveSuccess?: () => void;
}

export const ImageDownloadMenu: React.FC<ImageDownloadMenuProps> = ({
  imageUrl,
  prompt,
  onSaveSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quota, setQuota] = useState<{ image_quota: number; images_saved: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      loadQuota();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadQuota = async () => {
    try {
      const quotaData = await savedImageService.getUserQuota();
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const handleDirectDownload = () => {
    savedImageService.downloadImage(imageUrl);
    setIsOpen(false);
  };

  const handleSaveToLibrary = async () => {
    setLoading(true);
    try {
      await savedImageService.saveImage(imageUrl, prompt);
      alert('图片已保存到私有库');
      await loadQuota();
      if (onSaveSuccess) onSaveSuccess();
      setIsOpen(false);
    } catch (error: any) {
      alert(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200"
        title="下载选项"
      >
        <Download className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
          <div className="p-2 bg-gray-50 border-b border-gray-200">
            <div className="text-xs text-gray-600">
              {quota ? (
                <>已保存: {quota.images_saved} / {quota.image_quota}</>
              ) : (
                '加载中...'
              )}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={handleDirectDownload}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">直接下载</div>
                <div className="text-xs text-gray-500">保存到本地设备</div>
              </div>
            </button>

            <button
              onClick={handleSaveToLibrary}
              disabled={loading || (quota && quota.images_saved >= quota.image_quota)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HardDrive className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">
                  {loading ? '保存中...' : '保存到私有库'}
                </div>
                <div className="text-xs text-gray-500">
                  {quota && quota.images_saved >= quota.image_quota
                    ? '配额已满'
                    : '云端存储，随时查看'}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
