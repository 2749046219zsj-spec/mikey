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
  created_by: string | null;
}

export interface CreateProductCategoryInput {
  name: string;
  display_name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateProductCategoryInput {
  name?: string;
  display_name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const productService = {
  async getAllCategories(includeInactive = false): Promise<ProductCategory[]> {
    let query = supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch product categories: ${error.message}`);
    }

    return data || [];
  },

  async getCategoryById(id: string): Promise<ProductCategory | null> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch product category: ${error.message}`);
    }

    return data;
  },

  async createCategory(input: CreateProductCategoryInput): Promise<ProductCategory> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        ...input,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product category: ${error.message}`);
    }

    return data;
  },

  async updateCategory(id: string, input: UpdateProductCategoryInput): Promise<ProductCategory> {
    const { data, error } = await supabase
      .from('product_categories')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product category: ${error.message}`);
    }

    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product category: ${error.message}`);
    }
  },

  async toggleCategoryStatus(id: string): Promise<ProductCategory> {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error('Product category not found');
    }

    return this.updateCategory(id, { is_active: !category.is_active });
  }
};
