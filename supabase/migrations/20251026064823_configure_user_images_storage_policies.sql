/*
  # 配置用户图片存储策略

  1. Storage Bucket
    - 创建 user-images bucket（如果不存在）
    - 设置为公开访问

  2. Storage 策略
    - 用户只能访问自己文件夹下的文件
    - 按 user_id 隔离文件
    - 严格的访问控制
*/

-- 创建 user-images bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-images',
  'user-images',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "用户只能访问自己的文件夹" ON storage.objects;
DROP POLICY IF EXISTS "用户只能上传到自己的文件夹" ON storage.objects;
DROP POLICY IF EXISTS "用户只能删除自己的文件" ON storage.objects;
DROP POLICY IF EXISTS "用户只能更新自己的文件" ON storage.objects;

-- 创建新的存储策略：SELECT（查看/下载）
CREATE POLICY "用户只能访问自己的图片文件"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT（上传）
CREATE POLICY "用户只能上传到自己的图片文件夹"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE（删除）
CREATE POLICY "用户只能删除自己的图片文件"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE（更新）
CREATE POLICY "用户只能更新自己的图片文件"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
