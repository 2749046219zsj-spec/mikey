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
  product_id: string;
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

export class PublicReferenceImageService {
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
