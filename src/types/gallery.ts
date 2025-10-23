export interface GalleryImage {
  id: string;
  user_id: string;
  username: string;
  image_url: string;
  prompt: string | null;
  likes_count: number;
  created_at: string;
  metadata?: Record<string, any>;
  is_liked?: boolean;
}

export interface GalleryLike {
  id: string;
  gallery_id: string;
  user_id: string;
  created_at: string;
}

export type GallerySortBy = 'latest' | 'popular';
