/*
  # 创建公共画廊系统

  1. 功能说明
    - 用户通过点赞操作将生成的图片上传到公共画廊
    - 所有用户可以浏览公共画廊中的图片
    - 所有用户可以对画廊中的图片进行点赞
    - 显示上传者的用户名和点赞数

  2. 新建表
    - `public_gallery` - 公共画廊图片
      - `id` - 主键
      - `user_id` - 上传者ID
      - `username` - 上传者用户名（冗余字段，提高查询性能）
      - `image_url` - 图片URL
      - `prompt` - 生成提示词
      - `likes_count` - 点赞数（冗余字段，提高查询性能）
      - `created_at` - 上传时间
      - `metadata` - 其他元数据（JSON）

    - `gallery_likes` - 画廊点赞记录
      - `id` - 主键
      - `gallery_id` - 画廊图片ID
      - `user_id` - 点赞用户ID
      - `created_at` - 点赞时间
      - UNIQUE(gallery_id, user_id) - 确保每个用户只能对一张图片点赞一次

  3. 安全策略
    - 启用RLS
    - 所有用户都可以浏览公共画廊
    - 只有图片上传者可以删除自己的图片
    - 登录用户可以点赞和取消点赞
    - 所有用户可以查看点赞记录

  4. 性能优化
    - 为常用查询字段添加索引
    - 使用触发器自动更新点赞数
    - 冗余用户名字段避免JOIN查询
*/

-- 创建 public_gallery 表
CREATE TABLE IF NOT EXISTS public_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username text NOT NULL,
  image_url text NOT NULL,
  prompt text,
  likes_count integer DEFAULT 0 NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 创建 gallery_likes 表
CREATE TABLE IF NOT EXISTS gallery_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES public_gallery(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(gallery_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_public_gallery_created_at ON public_gallery(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_gallery_likes_count ON public_gallery(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_gallery_user_id ON public_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_likes_gallery_id ON gallery_likes(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_likes_user_id ON gallery_likes(user_id);

-- 启用 RLS
ALTER TABLE public_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_likes ENABLE ROW LEVEL SECURITY;

-- RLS 策略：所有人可以查看公共画廊
CREATE POLICY "Anyone can view public gallery"
  ON public_gallery FOR SELECT
  TO public
  USING (true);

-- RLS 策略：登录用户可以上传图片到画廊
CREATE POLICY "Authenticated users can upload to gallery"
  ON public_gallery FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户可以删除自己上传的图片
CREATE POLICY "Users can delete own gallery images"
  ON public_gallery FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：管理员可以删除任何图片
CREATE POLICY "Admins can delete any gallery image"
  ON public_gallery FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS 策略：所有人可以查看点赞记录
CREATE POLICY "Anyone can view likes"
  ON gallery_likes FOR SELECT
  TO public
  USING (true);

-- RLS 策略：登录用户可以点赞
CREATE POLICY "Authenticated users can like"
  ON gallery_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户可以取消自己的点赞
CREATE POLICY "Users can unlike"
  ON gallery_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 创建触发器函数：点赞时增加计数
CREATE OR REPLACE FUNCTION increment_gallery_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public_gallery
  SET likes_count = likes_count + 1
  WHERE id = NEW.gallery_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器函数：取消点赞时减少计数
CREATE OR REPLACE FUNCTION decrement_gallery_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public_gallery
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.gallery_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器
DROP TRIGGER IF EXISTS on_gallery_liked ON gallery_likes;
CREATE TRIGGER on_gallery_liked
  AFTER INSERT ON gallery_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_gallery_likes();

DROP TRIGGER IF EXISTS on_gallery_unliked ON gallery_likes;
CREATE TRIGGER on_gallery_unliked
  AFTER DELETE ON gallery_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_gallery_likes();
