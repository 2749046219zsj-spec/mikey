/*
  # 创建分享统计系统

  1. 新增表
    - `gallery_share_statistics` - 画廊分享统计表
      - `id` (uuid, primary key)
      - `gallery_id` (uuid, 关联 public_gallery)
      - `share_channel` (text, 分享渠道：link/download/wechat/email/xiaohongshu/douyin)
      - `user_id` (uuid, 可选，关联 auth.users)
      - `shared_at` (timestamp, 分享时间)
      - `ip_address` (text, IP地址用于去重)
      - `user_agent` (text, 用户代理)

  2. 安全性
    - 启用 RLS
    - 所有认证用户可以创建分享记录
    - 管理员可以查看所有统计数据
    - 普通用户只能查看自己的分享记录

  3. 索引
    - gallery_id 索引，优化按图片查询
    - share_channel 索引，优化按渠道统计
    - shared_at 索引，优化按时间查询

  4. 视图
    - 创建分享统计视图，方便查询热门内容
*/

-- 创建分享统计表
CREATE TABLE IF NOT EXISTS gallery_share_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public_gallery(id) ON DELETE CASCADE,
  share_channel text NOT NULL CHECK (share_channel IN ('link', 'download', 'wechat', 'email', 'xiaohongshu', 'douyin', 'other')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  shared_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- 启用 RLS
ALTER TABLE gallery_share_statistics ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可以创建分享记录
CREATE POLICY "Authenticated users can create share records"
  ON gallery_share_statistics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 匿名用户也可以创建分享记录（用于未登录分享）
CREATE POLICY "Anonymous users can create share records"
  ON gallery_share_statistics
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 管理员可以查看所有分享统计
CREATE POLICY "Admins can view all share statistics"
  ON gallery_share_statistics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 用户可以查看自己的分享记录
CREATE POLICY "Users can view own share records"
  ON gallery_share_statistics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_share_stats_gallery_id 
  ON gallery_share_statistics(gallery_id);

CREATE INDEX IF NOT EXISTS idx_share_stats_channel 
  ON gallery_share_statistics(share_channel);

CREATE INDEX IF NOT EXISTS idx_share_stats_shared_at 
  ON gallery_share_statistics(shared_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_stats_user_id 
  ON gallery_share_statistics(user_id);

-- 创建分享统计汇总视图
CREATE OR REPLACE VIEW gallery_share_summary AS
SELECT 
  g.id as gallery_id,
  g.prompt,
  g.image_url,
  g.username,
  COUNT(s.id) as total_shares,
  COUNT(CASE WHEN s.share_channel = 'link' THEN 1 END) as link_shares,
  COUNT(CASE WHEN s.share_channel = 'download' THEN 1 END) as download_shares,
  COUNT(CASE WHEN s.share_channel = 'wechat' THEN 1 END) as wechat_shares,
  COUNT(CASE WHEN s.share_channel = 'email' THEN 1 END) as email_shares,
  COUNT(CASE WHEN s.share_channel = 'xiaohongshu' THEN 1 END) as xiaohongshu_shares,
  COUNT(CASE WHEN s.share_channel = 'douyin' THEN 1 END) as douyin_shares,
  MAX(s.shared_at) as last_shared_at
FROM public_gallery g
LEFT JOIN gallery_share_statistics s ON g.id = s.gallery_id
GROUP BY g.id, g.prompt, g.image_url, g.username;

-- 创建热门分享内容视图（最近30天）
CREATE OR REPLACE VIEW hot_shared_gallery AS
SELECT 
  g.id,
  g.prompt,
  g.image_url,
  g.username,
  g.created_at,
  COUNT(s.id) as share_count
FROM public_gallery g
INNER JOIN gallery_share_statistics s ON g.id = s.gallery_id
WHERE s.shared_at >= NOW() - INTERVAL '30 days'
GROUP BY g.id, g.prompt, g.image_url, g.username, g.created_at
HAVING COUNT(s.id) >= 3
ORDER BY share_count DESC, g.created_at DESC;

-- 添加注释
COMMENT ON TABLE gallery_share_statistics IS '画廊分享统计表，记录用户分享行为';
COMMENT ON COLUMN gallery_share_statistics.share_channel IS '分享渠道：link(复制链接), download(下载), wechat(微信), email(邮件), xiaohongshu(小红书), douyin(抖音), other(其他)';
COMMENT ON VIEW gallery_share_summary IS '画廊分享统计汇总视图，按图片聚合分享数据';
COMMENT ON VIEW hot_shared_gallery IS '热门分享内容视图，显示最近30天分享次数>=3的内容';
