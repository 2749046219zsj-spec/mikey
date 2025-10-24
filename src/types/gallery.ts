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
  model_name?: string | null;
  generation_params?: Record<string, any>;
  use_as_reference_count?: number;
  remake_count?: number;
}

export interface GalleryLike {
  id: string;
  gallery_id: string;
  user_id: string;
  created_at: string;
}

export type GallerySortBy = 'latest' | 'popular';
