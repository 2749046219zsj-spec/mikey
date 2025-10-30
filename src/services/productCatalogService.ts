import { supabase } from '../lib/supabase';

export interface ProductCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductComment {
  id: string;
  product_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface ProductLike {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
}

export const productCatalogService = {
  async getCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getProductsByCategory(categoryId: string): Promise<CatalogProduct[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getProductById(productId: string): Promise<CatalogProduct | null> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getProductComments(productId: string): Promise<ProductComment[]> {
    const { data, error } = await supabase
      .from('catalog_product_comments')
      .select(`
        *,
        user_profiles(username, avatar_url)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addComment(productId: string, commentText: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('catalog_product_comments')
      .insert({
        product_id: productId,
        user_id: user.id,
        comment_text: commentText
      });

    if (error) throw error;
  },

  async updateComment(commentId: string, commentText: string): Promise<void> {
    const { error } = await supabase
      .from('catalog_product_comments')
      .update({ comment_text: commentText })
      .eq('id', commentId);

    if (error) throw error;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('catalog_product_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },

  async toggleLike(productId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: existingLike } = await supabase
      .from('catalog_product_likes')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      const { error } = await supabase
        .from('catalog_product_likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('catalog_product_likes')
        .insert({
          product_id: productId,
          user_id: user.id
        });

      if (error) throw error;
      return true;
    }
  },

  async checkIfLiked(productId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('catalog_product_likes')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data;
  },

  async createProduct(product: Partial<CatalogProduct>): Promise<CatalogProduct> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('catalog_products')
      .insert({
        ...product,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(productId: string, product: Partial<CatalogProduct>): Promise<void> {
    const { error } = await supabase
      .from('catalog_products')
      .update(product)
      .eq('id', productId);

    if (error) throw error;
  },

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from('catalog_products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  },

  async updateProductOrder(productId: string, newOrder: number): Promise<void> {
    const { error } = await supabase
      .from('catalog_products')
      .update({ display_order: newOrder })
      .eq('id', productId);

    if (error) throw error;
  }
};
