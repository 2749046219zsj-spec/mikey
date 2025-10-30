import { supabase } from '../lib/supabase';
import type { ProductCategory, CatalogProduct, ProductComment, CatalogProductWithCategory } from '../types/catalog';

export const catalogService = {
  async getCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getProductsByCategory(categoryId: string, userId?: string): Promise<CatalogProductWithCategory[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select(`
        *,
        category:product_categories(*)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (!userId || !data) return data || [];

    const productIds = data.map(p => p.id);
    const { data: likes } = await supabase
      .from('catalog_product_likes')
      .select('product_id')
      .eq('user_id', userId)
      .in('product_id', productIds);

    const likedIds = new Set(likes?.map(l => l.product_id) || []);

    return data.map(product => ({
      ...product,
      user_liked: likedIds.has(product.id)
    }));
  },

  async getProductDetail(productId: string, userId?: string): Promise<CatalogProductWithCategory | null> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select(`
        *,
        category:product_categories(*)
      `)
      .eq('id', productId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (userId) {
      const { data: like } = await supabase
        .from('catalog_product_likes')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();

      return {
        ...data,
        user_liked: !!like
      };
    }

    return data;
  },

  async toggleLike(productId: string, userId: string): Promise<boolean> {
    const { data: existingLike } = await supabase
      .from('catalog_product_likes')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
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
        .insert({ product_id: productId, user_id: userId });

      if (error) throw error;
      return true;
    }
  },

  async getComments(productId: string): Promise<ProductComment[]> {
    const { data, error } = await supabase
      .from('catalog_product_comments')
      .select(`
        *,
        user_profile:user_profiles!catalog_product_comments_user_id_fkey(username, avatar_url)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addComment(productId: string, userId: string, commentText: string): Promise<ProductComment> {
    const { data, error } = await supabase
      .from('catalog_product_comments')
      .insert({
        product_id: productId,
        user_id: userId,
        comment_text: commentText
      })
      .select(`
        *,
        user_profile:user_profiles!catalog_product_comments_user_id_fkey(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
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

  async createProduct(product: Partial<CatalogProduct>): Promise<CatalogProduct> {
    const { data, error } = await supabase
      .from('catalog_products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProduct(productId: string, updates: Partial<CatalogProduct>): Promise<void> {
    const { error } = await supabase
      .from('catalog_products')
      .update(updates)
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

  async reorderProducts(categoryId: string, productOrders: { id: string; display_order: number }[]): Promise<void> {
    const updates = productOrders.map(({ id, display_order }) =>
      supabase
        .from('catalog_products')
        .update({ display_order })
        .eq('id', id)
        .eq('category_id', categoryId)
    );

    await Promise.all(updates);
  }
};
