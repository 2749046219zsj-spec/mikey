import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  maxRetries?: number;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  onClick,
  maxRetries = 3
}) => {
  // 判断是否需要使用代理
  const getProxiedUrl = (url: string) => {
    // 如果是外部URL（不是Supabase存储），使用代理
    if (url.startsWith('http') && !url.includes('supabase.co')) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      return `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const [currentSrc, setCurrentSrc] = useState(getProxiedUrl(src));
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(getProxiedUrl(src));
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    setIsLoading(false);
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        const proxiedUrl = getProxiedUrl(src);
        setCurrentSrc(`${proxiedUrl}${proxiedUrl.includes('?') ? '&' : '?'}retry=${retryCount + 1}`);
      }, 1000 * (retryCount + 1));
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const manualRetry = () => {
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
    const proxiedUrl = getProxiedUrl(src);
    setCurrentSrc(`${proxiedUrl}${proxiedUrl.includes('?') ? '&' : '?'}manual=${Date.now()}`);
  };

  if (hasError) {
    return (
      <div
        className={`${className} bg-elegant-cream border-2 border-hermes-coral/20 flex flex-col items-center justify-center gap-2 p-4 relative group`}
        style={{ minHeight: '200px' }}
      >
        <div className="text-center">
          <p className="text-hermes-orange font-semibold text-sm mb-1">图片加载失败</p>
          <p className="text-elegant-gray text-xs mb-3">可能由于跨域限制或网络问题</p>
          <button
            onClick={manualRetry}
            className="px-3 py-1.5 bg-gradient-sunset hover:shadow-luxury-md text-white rounded-full text-xs font-medium flex items-center gap-1 mx-auto transition-all duration-300"
          >
            <RefreshCw size={12} />
            <span>重新加载</span>
          </button>
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-elegant-gray opacity-0 group-hover:opacity-100 transition-opacity">
          已重试 {retryCount} 次
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className="absolute inset-0 bg-elegant-cream flex items-center justify-center z-10"
          style={{ minHeight: '200px' }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="loader-luxury w-8 h-8"></div>
            <p className="text-xs text-elegant-gray font-medium">加载中...</p>
            {retryCount > 0 && (
              <p className="text-xs text-elegant-gray/70">重试 {retryCount}/{maxRetries}</p>
            )}
          </div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};
