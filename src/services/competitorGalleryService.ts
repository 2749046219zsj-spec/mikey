import { supabase } from '../lib/supabase';

export interface CompetitorImage {
  id: string;
  name: string | null;
  image_url: string;
  thumbnail_url: string | null;
  file_name: string;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitorImageFilters {
  category?: string;
  tags?: string[];
  searchTerm?: string;
}

export const competitorGalleryService = {
  async getCompetitorImages(filters?: CompetitorImageFilters): Promise<CompetitorImage[]> {
    try {
      let query = supabase
        .from('public_reference_images')
        .select('*')
        .eq('category', 'competitor')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,file_name.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('获取竞品图片失败:', error);
      throw error;
    }
  },

  async getCompetitorImageById(id: string): Promise<CompetitorImage | null> {
    try {
      const { data, error } = await supabase
        .from('public_reference_images')
        .select('*')
        .eq('id', id)
        .eq('category', 'competitor')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('获取竞品图片详情失败:', error);
      return null;
    }
  },

  async deleteCompetitorImage(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('public_reference_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('删除竞品图片失败:', error);
      throw error;
    }
  },

  async updateCompetitorImage(
    id: string,
    updates: Partial<Pick<CompetitorImage, 'name' | 'category' | 'tags' | 'is_active'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('public_reference_images')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('更新竞品图片失败:', error);
      throw error;
    }
  },

  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('public_reference_images')
        .select('category')
        .eq('category', 'competitor')
        .eq('is_active', true);

      if (error) throw error;

      const categories = [...new Set(data?.map(item => item.category).filter(Boolean))];
      return categories as string[];
    } catch (error) {
      console.error('获取分类列表失败:', error);
      return [];
    }
  },

  async getAllTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('public_reference_images')
        .select('tags')
        .eq('category', 'competitor')
        .eq('is_active', true);

      if (error) throw error;

      const allTags = new Set<string>();
      data?.forEach(item => {
        item.tags?.forEach((tag: string) => allTags.add(tag));
      });

      return Array.from(allTags);
    } catch (error) {
      console.error('获取标签列表失败:', error);
      return [];
    }
  },

  getImageSourceInfo(metadata: Record<string, any>): {
    pageUrl?: string;
    pageTitle?: string;
    productName?: string;
    price?: string;
  } {
    return {
      pageUrl: metadata?.pageUrl,
      pageTitle: metadata?.pageTitle,
      productName: metadata?.productName,
      price: metadata?.price,
    };
  },
};
