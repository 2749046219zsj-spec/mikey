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
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogProductWithCategory extends CatalogProduct {
  category: ProductCategory;
}

class CatalogService {
  async getActiveCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getAllCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getProductsByCategory(categoryId: string): Promise<CatalogProduct[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getAllProducts(): Promise<CatalogProductWithCategory[]> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select(`
        *,
        category:product_categories(*)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getProductById(productId: string): Promise<CatalogProduct | null> {
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createProduct(product: Omit<CatalogProduct, 'id' | 'created_at' | 'updated_at'>): Promise<CatalogProduct> {
    const { data, error } = await supabase
      .from('catalog_products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProduct(productId: string, updates: Partial<CatalogProduct>): Promise<CatalogProduct> {
    const { data, error } = await supabase
      .from('catalog_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from('catalog_products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  }

  async updateCategory(categoryId: string, updates: Partial<ProductCategory>): Promise<ProductCategory> {
    const { data, error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const catalogService = new CatalogService();
