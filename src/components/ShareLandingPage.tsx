import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Clock, User } from 'lucide-react';
import { GalleryImage } from '../types/gallery';
import { ImageWithFallback } from './ImageWithFallback';
import { updateShareMetaTags, resetMetaTags } from '../utils/metaUtils';

interface ShareLandingPageProps {
  image: GalleryImage;
  onNavigateToMain: () => void;
}

export default function ShareLandingPage({ image, onNavigateToMain }: ShareLandingPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const shareUrl = window.location.href;
    const title = `${image.username}的AI创意作品 - AI创意画廊`;
    const description = image.prompt
      ? `${image.prompt.substring(0, 150)}${image.prompt.length > 150 ? '...' : ''}`
      : `来自${image.username}的精彩AI创作，快来欣赏！`;

    updateShareMetaTags(title, description, image.image_url, shareUrl);

    return () => {
      resetMetaTags();
    };
  }, [image]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              AI创意画廊
            </span>
          </div>
          <button
            onClick={onNavigateToMain}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            探索更多
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div
          className={`max-w-5xl w-full transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* User Info */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-2 ring-white/50">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="text-white">
                  <p className="font-semibold text-lg">{image.username}</p>
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(image.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="bg-gray-50 p-6 md:p-10 flex items-center justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-xl max-w-full">
                <ImageWithFallback
                  src={image.image_url}
                  alt={image.prompt || 'AI创意作品'}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
            </div>

            {/* Prompt */}
            {image.prompt && (
              <div className="px-6 md:px-10 py-6 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">创作提示词</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {image.prompt}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Model Info */}
            {image.model_name && (
              <div className="px-6 md:px-10 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">使用模型:</span>
                    <span className="px-3 py-1 bg-white rounded-full text-gray-900 font-medium">
                      {image.model_name}
                    </span>
                  </div>
                  {image.generation_params?.stylePreset && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">风格:</span>
                      <span className="px-3 py-1 bg-white rounded-full text-gray-900 font-medium">
                        {image.generation_params.stylePreset}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CTA Section */}
            <div className="px-6 md:px-10 py-8 bg-gradient-to-br from-orange-50 to-pink-50">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  发现更多AI创意作品
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  加入我们的创意社区，探索无限可能。使用AI生成独特的香水瓶设计、产品渲染和创意图片。
                </p>
                <button
                  onClick={onNavigateToMain}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold text-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all hover:scale-105 active:scale-95"
                >
                  <span>立即体验AI创作</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="pt-4 flex items-center justify-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>完全免费</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>无需下载</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>即刻创作</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            由AI创意画廊提供技术支持 · 让创意触手可及
          </p>
        </div>
      </main>
    </div>
  );
}
