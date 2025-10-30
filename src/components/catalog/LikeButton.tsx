import React, { useState } from 'react';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  productId: string;
  liked: boolean;
  likesCount: number;
  onToggleLike: (productId: string) => Promise<void>;
  disabled?: boolean;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  productId,
  liked,
  likesCount,
  onToggleLike,
  disabled = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || disabled) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      await onToggleLike(productId);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={`
        flex items-center space-x-1.5 px-3 py-1.5 rounded-full
        transition-all duration-200 ease-in-out
        ${
          liked
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}
    >
      <Heart
        size={16}
        className={`transition-all duration-200 ${liked ? 'fill-current' : ''}`}
      />
      <span className="text-sm font-medium">{likesCount}</span>
    </button>
  );
};
