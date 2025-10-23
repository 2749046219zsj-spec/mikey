import { supabase } from '../lib/supabase';

export interface SavedImage {
  id: string;
  user_id: string;
  image_url: string;
  prompt?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserQuota {
  image_quota: number;
  images_saved: number;
}

export const savedImageService = {
  // 获取用户配额信息
  async getUserQuota(): Promise<UserQuota | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('image_quota, images_saved')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // 检查是否可以保存图片
  async canSaveImage(): Promise<boolean> {
    const quota = await this.getUserQuota();
    if (!quota) return false;
    return quota.images_saved < quota.image_quota;
  },

  // 保存图片到私有库
  async saveImage(imageUrl: string, prompt?: string, metadata?: Record<string, any>): Promise<SavedImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用户未登录');

    // 检查配额
    const canSave = await this.canSaveImage();
    if (!canSave) {
      const quota = await this.getUserQuota();
      throw new Error(`已达到存储上限（${quota?.image_quota || 0}张）`);
    }

    const { data, error } = await supabase
      .from('saved_images')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        prompt,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 获取用户保存的图片列表
  async getSavedImages(limit = 50, offset = 0): Promise<SavedImage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  },

  // 删除保存的图片
  async deleteSavedImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('saved_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
  },

  // 直接下载图片到本地
  downloadImage(imageUrl: string, filename?: string): void {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || `image-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
