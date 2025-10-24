import { supabase } from '../lib/supabase';
import { GalleryImage, GallerySortBy } from '../types/gallery';

export interface GenerationParams {
  modelName?: string;
  stylePreset?: string;
  imageCount?: number;
  productId?: string;
  craftId?: string;
  referenceImages?: string[];
  [key: string]: any;
}

export class GalleryService {
  static async uploadToGallery(
    userId: string,
    username: string,
    imageUrl: string,
    prompt?: string,
    generationParams?: GenerationParams
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('public_gallery')
        .insert({
          user_id: userId,
          username,
          image_url: imageUrl,
          prompt: prompt || null,
          model_name: generationParams?.modelName || null,
          generation_params: generationParams || {},
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to upload to gallery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  static async getGalleryImages(
    sortBy: GallerySortBy = 'latest',
    limit: number = 50,
    offset: number = 0,
    currentUserId?: string
  ): Promise<GalleryImage[]> {
    try {
      let query = supabase
        .from('public_gallery')
        .select('*')
        .range(offset, offset + limit - 1);

      if (sortBy === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      if (currentUserId) {
        const imageIds = data.map((img) => img.id);
        const { data: likes } = await supabase
          .from('gallery_likes')
          .select('gallery_id')
          .eq('user_id', currentUserId)
          .in('gallery_id', imageIds);

        const likedIds = new Set(likes?.map((like) => like.gallery_id) || []);

        return data.map((img) => ({
          ...img,
          is_liked: likedIds.has(img.id),
        }));
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch gallery images:', error);
      return [];
    }
  }

  static async toggleLike(
    galleryId: string,
    userId: string
  ): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
    try {
      const { data: existing } = await supabase
        .from('gallery_likes')
        .select('id')
        .eq('gallery_id', galleryId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('gallery_likes')
          .delete()
          .eq('gallery_id', galleryId)
          .eq('user_id', userId);

        if (error) throw error;

        return { success: true, isLiked: false };
      } else {
        const { error } = await supabase
          .from('gallery_likes')
          .insert({
            gallery_id: galleryId,
            user_id: userId,
          });

        if (error) throw error;

        return { success: true, isLiked: true };
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      return {
        success: false,
        isLiked: false,
        error: error instanceof Error ? error.message : '操作失败',
      };
    }
  }

  static async deleteGalleryImage(
    galleryId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('public_gallery')
        .delete()
        .eq('id', galleryId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to delete gallery image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      };
    }
  }

  static async getUserGalleryImages(
    userId: string,
    limit: number = 20
  ): Promise<GalleryImage[]> {
    try {
      const { data, error } = await supabase
        .from('public_gallery')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user gallery images:', error);
      return [];
    }
  }

  static async checkIfInGallery(imageUrl: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('public_gallery')
        .select('id')
        .eq('image_url', imageUrl)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Failed to check if image in gallery:', error);
      return false;
    }
  }

  static async logGalleryUsage(
    galleryId: string,
    userId: string,
    actionType: 'remake' | 'use_as_reference'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('gallery_usage_logs')
        .insert({
          gallery_id: galleryId,
          user_id: userId,
          action_type: actionType,
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to log gallery usage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '记录失败',
      };
    }
  }

  static async getGalleryImageById(galleryId: string): Promise<GalleryImage | null> {
    try {
      const { data, error } = await supabase
        .from('public_gallery')
        .select('*')
        .eq('id', galleryId)
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to fetch gallery image:', error);
      return null;
    }
  }
}
