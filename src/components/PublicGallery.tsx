import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Image as ImageIcon, Zap, Lightbulb, Layers, Workflow } from 'lucide-react';
import { GalleryImage, GallerySortBy } from '../types/gallery';
import { GalleryService } from '../services/galleryService';
import { GalleryImageCard } from './GalleryImageCard';
import { GalleryDetailModal } from './GalleryDetailModal';
import { FloatingAIPanel } from './FloatingAIPanel';
import { useAuth } from '../contexts/AuthContext';

interface PublicGalleryProps {
  onSubmitGeneration?: (prompt: string, images: File[]) => void;
}

export const PublicGallery: React.FC<PublicGalleryProps> = ({ onSubmitGeneration }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<GallerySortBy>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [floatingPrompt, setFloatingPrompt] = useState<string>('');
  const [floatingImages, setFloatingImages] = useState<File[]>([]);

  const loadImages = async (reset: boolean = false) => {
    if (!hasMore && !reset) return;

    setIsLoading(true);
    try {
      const newPage = reset ? 0 : page;
      const newImages = await GalleryService.getGalleryImages(
        sortBy,
        20,
        newPage * 20,
        user?.id
      );

      if (newImages.length < 20) {
        setHasMore(false);
      }

      if (reset) {
        setImages(newImages);
        setPage(1);
      } else {
        setImages((prev) => [...prev, ...newImages]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load gallery images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTotalCount = async () => {
    const count = await GalleryService.getTotalCount();
    setTotalCount(count);
  };

  useEffect(() => {
    setHasMore(true);
    loadImages(true);
    loadTotalCount();
  }, [sortBy, user?.id]);

  const handleScroll = () => {
    if (isLoading || !hasMore) return;

    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500;

    if (scrolledToBottom) {
      loadImages();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, page]);

  const handleLikeToggle = (imageId: string, isLiked: boolean) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              is_liked: isLiked,
              likes_count: isLiked ? img.likes_count + 1 : img.likes_count - 1,
            }
          : img
      )
    );
  };

  const handleDelete = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  const handleRemake = async (image: GalleryImage) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    await GalleryService.logGalleryUsage(image.id, user.id, 'remake');
    setFloatingPrompt(image.prompt || '');
    setShowFloatingPanel(true);
  };

  const handleUseAsReference = async (image: GalleryImage) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    await GalleryService.logGalleryUsage(image.id, user.id, 'use_as_reference');

    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const file = new File([blob], 'reference.jpg', { type: blob.type });
      setFloatingImages([file]);
      setShowFloatingPanel(true);
    } catch (error) {
      console.error('Failed to load reference image:', error);
    }
  };

  const handleFloatingPanelSubmit = async (prompt: string, images: File[]) => {
    if (onSubmitGeneration) {
      onSubmitGeneration(prompt, images);
    }
    setShowFloatingPanel(false);
    setFloatingPrompt('');
    setFloatingImages([]);
  };

  return (
    <div className="relative flex-1">
      {/* 炫酷动态背景 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* 渐变网格背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 opacity-50" />

        {/* 动态渐变光球 */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-orange-400/20 via-red-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-cyan-400/15 via-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-spin-slow" />

        {/* 动态光线效果 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-1 h-40 bg-gradient-to-b from-blue-400/40 to-transparent animate-float-up" />
          <div className="absolute top-40 right-32 w-1 h-32 bg-gradient-to-b from-purple-400/40 to-transparent animate-float-up" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-32 left-1/3 w-1 h-36 bg-gradient-to-b from-orange-400/40 to-transparent animate-float-up" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-20 w-1 h-28 bg-gradient-to-b from-pink-400/40 to-transparent animate-float-up" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* 粒子效果 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        {/* 网格线条效果 */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 pb-24">
        {/* 功能介绍模块 */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-elegant-black mb-3">
              为什么选择AI创意助手？
            </h2>
            <p className="text-base text-elegant-gray font-light">
              简单、快速、高质量的AI图像和视频生成体验
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 闪电速度 */}
            <div className="group bg-white rounded-2xl p-6 shadow-luxury-sm hover:shadow-luxury-md transition-all duration-300 border border-elegant-sand/20 hover:border-hermes-orange/30">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-elegant-black mb-2">
                闪电速度
              </h3>
              <p className="text-sm text-elegant-gray leading-relaxed">
                即时生成高质量图像，告别漫长等待，灵感瞬间呈现
              </p>
            </div>

            {/* 一键创作 */}
            <div className="group bg-white rounded-2xl p-6 shadow-luxury-sm hover:shadow-luxury-md transition-all duration-300 border border-elegant-sand/20 hover:border-hermes-orange/30">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Lightbulb size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-elegant-black mb-2">
                一键创作
              </h3>
              <p className="text-sm text-elegant-gray leading-relaxed">
                无需复杂提示词，上传参考图片即可生成，小白也能轻松上手
              </p>
            </div>

            {/* 场景丰富 */}
            <div className="group bg-white rounded-2xl p-6 shadow-luxury-sm hover:shadow-luxury-md transition-all duration-300 border border-elegant-sand/20 hover:border-hermes-orange/30">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Layers size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-elegant-black mb-2">
                场景丰富
              </h3>
              <p className="text-sm text-elegant-gray leading-relaxed">
                覆盖产品设计与漫画图文，多种创作模板随心切换，满足全场景需求
              </p>
            </div>

            {/* 智能工作流 */}
            <div className="group bg-white rounded-2xl p-6 shadow-luxury-sm hover:shadow-luxury-md transition-all duration-300 border border-elegant-sand/20 hover:border-hermes-orange/30">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Workflow size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-elegant-black mb-2">
                智能工作流
              </h3>
              <p className="text-sm text-elegant-gray leading-relaxed">
                批量处理快速导出，从创意到成品一站搞定，大幅提升设计效率
              </p>
            </div>
          </div>
        </div>

        {/* 奢华标题区域 */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full mb-6 shadow-luxury-sm border border-elegant-sand/30">
            <Sparkles className="text-hermes-orange" size={20} />
            <span className="text-sm font-medium text-elegant-charcoal tracking-wider uppercase">AI创意画廊</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif font-semibold text-elegant-black mb-4 tracking-tight">
            探索<span className="text-luxury-gradient">无限</span>创意
          </h1>
          <p className="text-lg text-elegant-gray max-w-2xl mx-auto leading-relaxed font-light">
            发现社区用户分享的精彩AI生成作品，获取灵感，点赞你喜欢的创作
          </p>
        </div>

        {/* 优雅的筛选栏 */}
        <div className="flex items-center justify-between mb-10 bg-white rounded-2xl p-5 shadow-luxury-sm border border-elegant-sand/20">
          <div className="flex items-center gap-3 text-sm text-elegant-charcoal font-medium">
            <div className="w-8 h-8 bg-gradient-sunset rounded-full flex items-center justify-center">
              <ImageIcon size={16} className="text-white" />
            </div>
            <span className="font-decorative text-base">{totalCount} 件作品</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm tracking-wide transition-luxury ${
                sortBy === 'latest'
                  ? 'bg-gradient-sunset text-white shadow-luxury-md'
                  : 'bg-white text-elegant-charcoal hover:bg-elegant-cream border-2 border-elegant-sand'
              }`}
            >
              <Clock size={16} />
              <span>最新</span>
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm tracking-wide transition-luxury ${
                sortBy === 'popular'
                  ? 'bg-gradient-sunset text-white shadow-luxury-md'
                  : 'bg-white text-elegant-charcoal hover:bg-elegant-cream border-2 border-elegant-sand'
              }`}
            >
              <TrendingUp size={16} />
              <span>热门</span>
            </button>
          </div>
        </div>

        {/* 空状态 - 优雅展示 */}
        {images.length === 0 && !isLoading ? (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-luxury">
              <ImageIcon size={40} className="text-luxury-gold" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-elegant-black mb-3">
              画廊暂时还是空的
            </h3>
            <p className="text-elegant-gray font-light">
              成为第一个分享作品的用户吧！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(index % 12) * 50}ms` }}
              >
                <GalleryImageCard
                  image={image}
                  currentUserId={user?.id}
                  onLikeToggle={handleLikeToggle}
                  onDelete={handleDelete}
                  onClick={() => setSelectedImage(image)}
                />
              </div>
            ))}
          </div>
        )}

        {/* 奢华加载动画 */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="loader-luxury" />
              <p className="text-sm text-elegant-gray font-medium tracking-wide">精心加载中...</p>
            </div>
          </div>
        )}

        {/* 底部提示 */}
        {!isLoading && !hasMore && images.length > 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/80 backdrop-blur-sm rounded-full shadow-luxury-sm border border-elegant-sand/30">
              <Sparkles size={18} className="text-luxury-gold" />
              <span className="text-sm text-elegant-charcoal font-medium tracking-wide">已展示所有精彩作品</span>
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <GalleryDetailModal
          image={selectedImage}
          currentUserId={user?.id}
          onClose={() => setSelectedImage(null)}
          onRemake={handleRemake}
          onUseAsReference={handleUseAsReference}
        />
      )}

      <FloatingAIPanel
        isOpen={showFloatingPanel}
        onClose={() => {
          setShowFloatingPanel(false);
          setFloatingPrompt('');
          setFloatingImages([]);
        }}
        onSubmit={handleFloatingPanelSubmit}
        initialPrompt={floatingPrompt}
        initialImages={floatingImages}
      />
    </div>
  );
};
