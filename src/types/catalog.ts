export interface ProductCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CatalogProduct {
  id: string;
  category_id: string;
  name: string;
  image_url: string;
  size_specs: string;
  inspiration: string;
  story: string;
  description: string;
  display_order: number;
  is_active: boolean;
  likes_count: number;
  comments_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProductLike {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
}

export interface ProductComment {
  id: string;
  product_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username: string;
    avatar_url?: string;
  };
}

export interface CatalogProductWithCategory extends CatalogProduct {
  category?: ProductCategory;
  user_liked?: boolean;
}
