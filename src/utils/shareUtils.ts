export const shareUtils = {
  copyToClipboard: async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        textArea.remove();
        return result;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },

  generateShareUrl: (galleryId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?share=${galleryId}`;
  },

  downloadImageWithWatermark: async (
    imageUrl: string,
    filename: string = 'image.png',
    watermarkText: string = 'AI创意画廊'
  ): Promise<void> => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(img.width / 30, 16);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;

      const padding = fontSize;
      const x = img.width - ctx.measureText(watermarkText).width - padding;
      const y = img.height - padding;

      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);

      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to download image with watermark:', error);
      throw error;
    }
  },

  shareToWechat: (url: string, title: string, description?: string): void => {
    if (typeof window !== 'undefined' && (window as any).wx) {
      const wx = (window as any).wx;
      wx.ready(() => {
        wx.updateAppMessageShareData({
          title: title,
          desc: description || '来自AI创意画廊的精彩内容',
          link: url,
          imgUrl: '',
          success: () => {
            console.log('WeChat share config success');
          }
        });

        wx.updateTimelineShareData({
          title: title,
          link: url,
          imgUrl: '',
          success: () => {
            console.log('WeChat timeline share config success');
          }
        });
      });
    } else {
      alert('请在微信中打开，或复制链接后在微信中分享');
    }
  },

  shareToEmail: (url: string, title: string, body?: string): void => {
    const subject = encodeURIComponent(title);
    const emailBody = encodeURIComponent(
      `${body || '我发现了一个很棒的AI创意设计，分享给你：'}\n\n${url}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${emailBody}`;
  },

  shareToXiaohongshu: (imageUrl: string, title: string): void => {
    shareUtils.copyToClipboard(`${title}\n\n查看完整内容：${imageUrl}`);
    alert('内容已复制到剪贴板，请打开小红书APP粘贴发布');
  },

  shareToDouyin: (): void => {
    alert('请截图保存，然后在抖音APP中上传并发布');
  }
};
