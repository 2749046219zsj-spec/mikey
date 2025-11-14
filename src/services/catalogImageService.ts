import { supabase } from '../lib/supabase';

export const catalogImageService = {
  async uploadProductImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('catalog-product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('catalog-product-images')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteProductImage(imageUrl: string): Promise<void> {
    const urlParts = imageUrl.split('/catalog-product-images/');
    if (urlParts.length !== 2) {
      throw new Error('Invalid image URL format');
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('catalog-product-images')
      .remove([filePath]);

    if (error) throw error;
  },

  getImageUrl(path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from('catalog-product-images')
      .getPublicUrl(path);

    return publicUrl;
  }
};
