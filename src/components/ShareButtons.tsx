import { useState } from 'react';
import {
  Link2,
  Download,
  Mail,
  MessageCircle,
  Share2,
  Check,
  Loader2
} from 'lucide-react';
import { shareUtils } from '../utils/shareUtils';
import { shareService, type ShareChannel } from '../services/shareService';

interface ShareButtonsProps {
  galleryId: string;
  imageUrl: string;
  title: string;
  description?: string;
}

export default function ShareButtons({
  galleryId,
  imageUrl,
  title,
  description
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleShare = async (channel: ShareChannel, action: () => void | Promise<void>) => {
    try {
      await action();
      await shareService.recordShare(galleryId, channel);
    } catch (error) {
      console.error(`Failed to share via ${channel}:`, error);
    }
  };

  const handleCopyLink = async () => {
    const url = shareUtils.generateShareUrl(galleryId);
    const success = await shareUtils.copyToClipboard(url);

    if (success) {
      setCopied(true);
      await shareService.recordShare(galleryId, 'link');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await shareUtils.downloadImageWithWatermark(
        imageUrl,
        `ai-gallery-${galleryId}.png`,
        'AI创意画廊'
      );
      await shareService.recordShare(galleryId, 'download');
    } catch (error) {
      alert('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  const handleWechatShare = () => {
    handleShare('wechat', () => {
      const url = shareUtils.generateShareUrl(galleryId);
      shareUtils.shareToWechat(url, title, description);
    });
  };

  const handleEmailShare = () => {
    handleShare('email', () => {
      const url = shareUtils.generateShareUrl(galleryId);
      shareUtils.shareToEmail(url, title, description);
    });
  };

  const handleXiaohongshuShare = async () => {
    await handleShare('xiaohongshu', () => {
      const url = shareUtils.generateShareUrl(galleryId);
      shareUtils.shareToXiaohongshu(url, title);
    });
  };

  const handleDouyinShare = async () => {
    await handleShare('douyin', () => {
      shareUtils.shareToDouyin();
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">已复制</span>
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            <span className="text-sm font-medium">复制链接</span>
          </>
        )}
      </button>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">下载中...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">下载图片</span>
          </>
        )}
      </button>

      <button
        onClick={handleWechatShare}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">微信分享</span>
      </button>

      <button
        onClick={handleEmailShare}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
      >
        <Mail className="w-4 h-4" />
        <span className="text-sm font-medium">邮件分享</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setShowMoreOptions(!showMoreOptions)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">更多</span>
        </button>

        {showMoreOptions && (
          <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px] z-50">
            <button
              onClick={() => {
                handleXiaohongshuShare();
                setShowMoreOptions(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-red-500">📱</span>
              小红书
            </button>
            <button
              onClick={() => {
                handleDouyinShare();
                setShowMoreOptions(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span>🎵</span>
              抖音
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
