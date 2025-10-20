import { supabase } from '../lib/supabase';
import type { ReferenceImage } from '../types/referenceImage';

export class ReferenceImageService {
  private static readonly BUCKET_NAME = 'reference-images';

  static async getUserReferenceImages(userId: string): Promise<ReferenceImage[]> {
    const { data, error } = await supabase
      .from('reference_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reference images:', error);
      throw error;
    }

    return data || [];
  }

  static async uploadReferenceImage(
    userId: string,
    file: File
  ): Promise<ReferenceImage> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { data: insertData, error: insertError } = await supabase
      .from('reference_images')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
      console.error('Error inserting reference image record:', insertError);
      throw insertError;
    }

    return insertData;
  }

  static async deleteReferenceImage(imageId: string, imageUrl: string): Promise<void> {
    const urlParts = imageUrl.split('/');
    const fileName = urlParts.slice(-2).join('/');

    const { error: deleteError } = await supabase
      .from('reference_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Error deleting reference image record:', deleteError);
      throw deleteError;
    }

    const { error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([fileName]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }
  }

  static async batchDeleteReferenceImages(images: ReferenceImage[]): Promise<void> {
    const imageIds = images.map(img => img.id);
    const fileNames = images.map(img => {
      const urlParts = img.image_url.split('/');
      return urlParts.slice(-2).join('/');
    });

    const { error: deleteError } = await supabase
      .from('reference_images')
      .delete()
      .in('id', imageIds);

    if (deleteError) {
      console.error('Error batch deleting reference images:', deleteError);
      throw deleteError;
    }

    const { error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove(fileNames);

    if (storageError) {
      console.error('Error batch deleting files from storage:', storageError);
    }
  }
}
