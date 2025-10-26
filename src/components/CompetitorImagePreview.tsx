import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CompetitorImage {
  id: string;
  image_url: string;
  file_name: string;
}

interface CompetitorImagePreviewProps {
  onSelectImage: (file: File) => void;
  selectedImages: File[];
}

export const CompetitorImagePreview: React.FC<CompetitorImagePreviewProps> = ({
  onSelectImage,
  selectedImages
}) => {
  const [images, setImages] = useState<CompetitorImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCompetitorImages();
  }, []);

  const loadCompetitorImages = async () => {
    try {
      const { data, error } = await supabase
        .from('public_reference_images')
        .select('id, image_url, file_name')
        .eq('category', 'competitor')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error loading competitor images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = async (image: CompetitorImage) => {
    if (selectedUrls.has(image.image_url)) {
      setSelectedUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.image_url);
        return newSet;
      });
      return;
    }

    try {
      const response = await fetch(image.image_url, {
        mode: 'cors',
        credentials: 'omit'
      });
      const blob = await response.blob();
      const file = new File([blob], image.file_name, { type: blob.type || 'image/jpeg' });

      onSelectImage(file);
      setSelectedUrls(prev => new Set(prev).add(image.image_url));
    } catch (error) {
      console.error('Failed to load image:', error);
      alert('加载图片失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-b border-blue-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-sm text-gray-600 text-center">加载竞品图片中...</div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-b border-blue-200">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">竞品参考图库</h3>
          <span className="text-xs text-gray-500">({images.length}张)</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
          {images.map((image) => (
            <div
              key={image.id}
              onClick={() => handleImageClick(image)}
              className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer transition-all group ${
                selectedUrls.has(image.image_url)
                  ? 'ring-4 ring-green-500 scale-105'
                  : 'ring-2 ring-blue-300 hover:ring-blue-500'
              }`}
            >
              <img
                src={image.image_url}
                alt={image.file_name}
                className="w-full h-full object-cover"
              />
              {selectedUrls.has(image.image_url) && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">✓</span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>

        {selectedUrls.size > 0 && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            已选择 {selectedUrls.size} 张竞品图片作为参考
          </div>
        )}
      </div>
    </div>
  );
};
