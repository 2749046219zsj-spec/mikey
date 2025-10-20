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
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    setIsLoading(false);
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${retryCount + 1}&t=${Date.now()}`);
        setIsLoading(true);
      }, delay);
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
    setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}manual=${Date.now()}`);
  };

  if (hasError) {
    return (
      <div
        className={`${className} bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center gap-2 p-4 relative group`}
        style={{ minHeight: '200px' }}
      >
        <div className="text-center">
          <p className="text-red-600 font-semibold text-sm mb-1">图片加载失败</p>
          <p className="text-red-500 text-xs mb-3">可能由于跨域限制或网络问题</p>
          <button
            onClick={manualRetry}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 mx-auto transition-colors"
          >
            <RefreshCw size={12} />
            <span>重新加载</span>
          </button>
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
          已重试 {retryCount} 次
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10"
          style={{ minHeight: '200px' }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500">加载中...</p>
            {retryCount > 0 && (
              <p className="text-xs text-gray-400">重试 {retryCount}/{maxRetries}</p>
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
        loading="eager"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
