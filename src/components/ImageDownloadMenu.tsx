import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; right?: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      loadQuota();
      adjustMenuPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const adjustMenuPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224; // 14rem = 224px
      const menuHeight = 160; // Approximate menu height
      const spaceOnRight = window.innerWidth - buttonRect.right;
      const spaceBelow = window.innerHeight - buttonRect.bottom;

      let top = buttonRect.bottom + 8; // 8px margin below button
      let left = buttonRect.right - menuWidth; // Default: align right edge

      // If not enough space on right, align to left edge of button
      if (spaceOnRight < menuWidth) {
        left = buttonRect.left;
      }

      // If not enough space below, position above button
      if (spaceBelow < menuHeight) {
        top = buttonRect.top - menuHeight - 8;
      }

      // Ensure menu stays within viewport
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (top < 8) top = 8;

      setMenuPosition({ top, left });
    }
  };

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
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors duration-200"
        title="下载选项"
      >
        <Download className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[9999]"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
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
        </div>,
        document.body
      )}
    </div>
  );
};
