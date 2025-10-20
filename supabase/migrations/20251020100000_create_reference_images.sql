/*
  # 创建用户参考图管理系统

  ## 新增表

  ### `reference_images` 表
  存储用户上传的参考图片信息

  - `id` (uuid, primary key): 图片唯一标识
  - `user_id` (uuid, foreign key): 所属用户ID，关联到 auth.users
  - `image_url` (text): 图片存储URL
  - `thumbnail_url` (text, nullable): 缩略图URL（可选）
  - `file_name` (text): 原始文件名
  - `file_size` (integer): 文件大小（字节）
  - `mime_type` (text): 文件MIME类型
  - `created_at` (timestamptz): 创建时间
  - `updated_at` (timestamptz): 更新时间

  ## 安全性

  - 启用 RLS（行级安全）
  - 用户只能查看、创建、删除自己的参考图
  - 使用 auth.uid() 进行用户身份验证

  ## 存储桶

  - 创建 `reference-images` 存储桶用于存储图片
  - 启用公共访问以便图片可被查看
  - RLS 策略控制上传和删除权限
*/

-- 创建参考图表
CREATE TABLE IF NOT EXISTS reference_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  thumbnail_url text,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_reference_images_user_id ON reference_images(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_images_created_at ON reference_images(created_at DESC);

-- 启用 RLS
ALTER TABLE reference_images ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看自己的参考图
CREATE POLICY "Users can view own reference images"
  ON reference_images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 策略：用户可以上传参考图
CREATE POLICY "Users can insert own reference images"
  ON reference_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户可以删除自己的参考图
CREATE POLICY "Users can delete own reference images"
  ON reference_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true)
ON CONFLICT (id) DO NOTHING;

-- 存储桶 RLS 策略：允许认证用户上传
CREATE POLICY "Authenticated users can upload reference images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reference-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 存储桶 RLS 策略：允许所有人查看（因为桶是公开的）
CREATE POLICY "Anyone can view reference images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'reference-images');

-- 存储桶 RLS 策略：用户可以删除自己的图片
CREATE POLICY "Users can delete own reference images from storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reference-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_reference_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reference_images_updated_at
  BEFORE UPDATE ON reference_images
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_images_updated_at();
