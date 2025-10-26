import { supabase } from '../lib/supabase';

export type ShareChannel = 'link' | 'download' | 'wechat' | 'email' | 'xiaohongshu' | 'douyin' | 'other';

interface ShareStatistics {
  id: string;
  gallery_id: string;
  share_channel: ShareChannel;
  user_id?: string;
  shared_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const shareService = {
  async recordShare(galleryId: string, channel: ShareChannel): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const shareData: Partial<ShareStatistics> = {
        gallery_id: galleryId,
        share_channel: channel,
        user_id: user?.id,
        user_agent: navigator.userAgent
      };

      const { error } = await supabase
        .from('gallery_share_statistics')
        .insert(shareData);

      if (error) {
        console.error('Failed to record share:', error);
      }
    } catch (error) {
      console.error('Error recording share:', error);
    }
  },

  async getShareStatistics(galleryId: string) {
    const { data, error } = await supabase
      .from('gallery_share_statistics')
      .select('share_channel, shared_at')
      .eq('gallery_id', galleryId)
      .order('shared_at', { ascending: false });

    if (error) {
      console.error('Failed to get share statistics:', error);
      return [];
    }

    return data || [];
  },

  async getShareSummary(galleryId: string) {
    const { data, error } = await supabase
      .from('gallery_share_summary')
      .select('*')
      .eq('gallery_id', galleryId)
      .single();

    if (error) {
      console.error('Failed to get share summary:', error);
      return null;
    }

    return data;
  },

  async getHotSharedGallery(limit: number = 10) {
    const { data, error } = await supabase
      .from('hot_shared_gallery')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Failed to get hot shared gallery:', error);
      return [];
    }

    return data || [];
  }
};
