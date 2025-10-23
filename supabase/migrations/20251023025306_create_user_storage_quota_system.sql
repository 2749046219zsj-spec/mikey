/*
  # 创建用户存储配额管理系统

  1. 功能说明
    - 为每个用户分配图片存储配额（默认500张）
    - 跟踪用户已保存的图片数量
    - 管理员可以调整用户配额
    - 支持图片下载到私有库或直接下载

  2. 新增列
    - `user_profiles` 表添加配额相关字段：
      - `image_quota` - 用户可保存的图片总数（默认500）
      - `images_saved` - 已保存的图片数量（默认0）
    
  3. 新建表
    - `saved_images` - 用户保存的生成图片记录
      - `id` - 主键
      - `user_id` - 用户ID
      - `image_url` - 图片URL
      - `prompt` - 生成提示词
      - `created_at` - 保存时间
      - `metadata` - 其他元数据（JSON）

  4. 安全策略
    - 启用RLS
    - 用户只能访问自己的保存记录
    - 管理员可以查看所有记录和修改配额
*/

-- 添加配额字段到 user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'image_quota'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN image_quota integer DEFAULT 500 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'images_saved'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN images_saved integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- 创建 saved_images 表
CREATE TABLE IF NOT EXISTS saved_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  prompt text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_saved_images_user_id ON saved_images(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_images_created_at ON saved_images(created_at DESC);

-- 启用 RLS
ALTER TABLE saved_images ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户查看自己保存的图片
CREATE POLICY "Users can view own saved images"
  ON saved_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：用户插入自己的图片（需要检查配额）
CREATE POLICY "Users can save images within quota"
  ON saved_images FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      SELECT images_saved < image_quota
      FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- RLS 策略：用户删除自己的图片
CREATE POLICY "Users can delete own saved images"
  ON saved_images FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：管理员查看所有保存的图片
CREATE POLICY "Admins can view all saved images"
  ON saved_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 创建触发器函数：保存图片时更新计数
CREATE OR REPLACE FUNCTION increment_images_saved()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET images_saved = images_saved + 1
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器函数：删除图片时更新计数
CREATE OR REPLACE FUNCTION decrement_images_saved()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET images_saved = GREATEST(0, images_saved - 1)
  WHERE user_id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 绑定触发器
DROP TRIGGER IF EXISTS on_image_saved ON saved_images;
CREATE TRIGGER on_image_saved
  AFTER INSERT ON saved_images
  FOR EACH ROW
  EXECUTE FUNCTION increment_images_saved();

DROP TRIGGER IF EXISTS on_image_deleted ON saved_images;
CREATE TRIGGER on_image_deleted
  AFTER DELETE ON saved_images
  FOR EACH ROW
  EXECUTE FUNCTION decrement_images_saved();

-- 为现有用户设置默认配额
UPDATE user_profiles
SET image_quota = 500, images_saved = 0
WHERE image_quota IS NULL;