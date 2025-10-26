import { supabase } from '../lib/supabase';

export interface PublicReferenceProduct {
  id: string;
  title: string;
  product_code: string;
  category_id: string | null;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PublicReferenceImage {
  id: string;
  product_id: string | null;
  user_id: string | null;
  image_url: string;
  thumbnail_url: string | null;
  file_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProductWithImages extends PublicReferenceProduct {
  images: PublicReferenceImage[];
}

export interface CompetitorImage {
  id: string;
  user_id: string;
  name: string | null;
  image_url: string;
  thumbnail_url: string | null;
  file_name: string;
  created_at: string;
  updated_at: string;
}

export class PublicReferenceImageService {
  static async getCompetitorImages(userId?: string): Promise<CompetitorImage[]> {
    // 从数据库表查询竞品图片（自动按用户过滤）
    const query = supabase
      .from('public_reference_images')
      .select('*')
      .is('product_id', null)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // 如果提供了 userId，显式过滤
    if (userId) {
      query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching competitor images:', error);
      throw error;
    }

    return (data || []).map(img => ({
      id: img.id,
      user_id: img.user_id,
      name: img.name,
      image_url: img.image_url,
      thumbnail_url: img.thumbnail_url || img.image_url,
      file_name: img.file_name,
      created_at: img.created_at,
      updated_at: img.updated_at
    }));
  }

  static async deleteCompetitorImage(imageId: string): Promise<void> {
    // 从数据库删除记录（RLS 会确保只能删除自己的）
    const { error } = await supabase
      .from('public_reference_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Error deleting competitor image:', error);
      throw error;
    }
  }

  static async getAllProducts(): Promise<PublicReferenceProduct[]> {
    const { data, error } = await supabase
      .from('public_reference_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching public products:', error);
      throw error;
    }

    return data || [];
  }

  static async getProductsWithImages(): Promise<ProductWithImages[]> {
    const { data: products, error: productsError } = await supabase
      .from('public_reference_products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (productsError) {
      console.error('Error fetching public products:', productsError);
      throw productsError;
    }

    if (!products || products.length === 0) {
      return [];
    }

    const productIds = products.map(p => p.id);
    const { data: images, error: imagesError } = await supabase
      .from('public_reference_images')
      .select('*')
      .in('product_id', productIds)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (imagesError) {
      console.error('Error fetching public images:', imagesError);
      throw imagesError;
    }

    const imagesByProduct = (images || []).reduce((acc, img) => {
      if (!acc[img.product_id]) {
        acc[img.product_id] = [];
      }
      acc[img.product_id].push(img);
      return acc;
    }, {} as Record<string, PublicReferenceImage[]>);

    return products.map(product => ({
      ...product,
      images: imagesByProduct[product.id] || []
    }));
  }

  static async getProductImages(productId: string): Promise<PublicReferenceImage[]> {
    const { data, error } = await supabase
      .from('public_reference_images')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching product images:', error);
      throw error;
    }

    return data || [];
  }
}
