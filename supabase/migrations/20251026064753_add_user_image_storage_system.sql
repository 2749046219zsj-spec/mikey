/*
  # 添加用户图片存储系统

  1. 修改现有表
    - 在 `user_profiles` 表添加存储配额字段
      - `storage_quota_mb` (integer, 存储配额MB，默认100)
      - `storage_used_mb` (decimal, 已使用存储MB)
      - `avatar_url` (text, 头像URL)

  2. 新表
    - `user_images` - 用户图片表
      - 完整的图片元数据和管理
    
    - `user_image_tags` - 图片标签表
      - 支持图片分类和搜索

  3. 安全策略
    - 严格的 RLS 数据隔离
    - 用户只能访问自己的图片
    
  4. 触发器
    - 自动更新存储使用量
*/

-- 添加字段到 user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'storage_quota_mb'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN storage_quota_mb INTEGER DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'storage_used_mb'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN storage_used_mb DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 创建用户图片表
CREATE TABLE IF NOT EXISTS user_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'user-images',
  thumbnail_url TEXT,
  image_url TEXT NOT NULL,
  upload_source TEXT DEFAULT 'browser-extension',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建图片标签表
CREATE TABLE IF NOT EXISTS user_image_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES user_images(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(image_id, tag_name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_images_user_id ON user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_images_created_at ON user_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_image_tags_user_id ON user_image_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_image_tags_image_id ON user_image_tags(image_id);

-- 启用 RLS
ALTER TABLE user_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_image_tags ENABLE ROW LEVEL SECURITY;

-- user_images RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_images' AND policyname = '用户只能查看自己的图片'
  ) THEN
    CREATE POLICY "用户只能查看自己的图片"
      ON user_images FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_images' AND policyname = '用户只能上传到自己的图库'
  ) THEN
    CREATE POLICY "用户只能上传到自己的图库"
      ON user_images FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_images' AND policyname = '用户只能删除自己的图片'
  ) THEN
    CREATE POLICY "用户只能删除自己的图片"
      ON user_images FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_images' AND policyname = '用户只能更新自己的图片'
  ) THEN
    CREATE POLICY "用户只能更新自己的图片"
      ON user_images FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- user_image_tags RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_image_tags' AND policyname = '用户只能查看自己的标签'
  ) THEN
    CREATE POLICY "用户只能查看自己的标签"
      ON user_image_tags FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_image_tags' AND policyname = '用户只能创建自己的标签'
  ) THEN
    CREATE POLICY "用户只能创建自己的标签"
      ON user_image_tags FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_image_tags' AND policyname = '用户只能删除自己的标签'
  ) THEN
    CREATE POLICY "用户只能删除自己的标签"
      ON user_image_tags FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_user_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_images_updated_at ON user_images;
CREATE TRIGGER trigger_update_user_images_updated_at
  BEFORE UPDATE ON user_images
  FOR EACH ROW
  EXECUTE FUNCTION update_user_images_updated_at();

-- 创建触发器：自动更新存储使用量
CREATE OR REPLACE FUNCTION update_user_storage_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles
    SET storage_used_mb = COALESCE(storage_used_mb, 0) + (NEW.file_size_bytes::decimal / 1024 / 1024)
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles
    SET storage_used_mb = GREATEST(0, COALESCE(storage_used_mb, 0) - (OLD.file_size_bytes::decimal / 1024 / 1024))
    WHERE id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_storage_usage ON user_images;
CREATE TRIGGER trigger_update_user_storage_usage
  AFTER INSERT OR DELETE ON user_images
  FOR EACH ROW
  EXECUTE FUNCTION update_user_storage_usage();
