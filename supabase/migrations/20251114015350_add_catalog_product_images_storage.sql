/*
  # 创建产品目录图片存储系统

  ## 概述
  为AI创意画廊（产品目录）创建专用的图片存储桶和相关策略

  ## 存储桶
  - `catalog-product-images` - 产品图片存储桶
    - 公开访问（所有人可查看）
    - 认证用户可上传
    - 管理员和有权限用户可删除

  ## 安全策略
  - 允许公开读取
  - 认证用户可上传
  - 只有管理员或产品管理权限用户可删除
*/

-- 创建产品图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-product-images',
  'catalog-product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 允许所有人查看产品图片
DROP POLICY IF EXISTS "Public can view catalog product images" ON storage.objects;
CREATE POLICY "Public can view catalog product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalog-product-images');

-- 认证用户可以上传产品图片
DROP POLICY IF EXISTS "Authenticated users can upload catalog product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload catalog product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'catalog-product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 用户可以更新自己上传的图片
DROP POLICY IF EXISTS "Users can update own catalog product images" ON storage.objects;
CREATE POLICY "Users can update own catalog product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'catalog-product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 管理员和有产品管理权限的用户可以删除图片
DROP POLICY IF EXISTS "Product managers can delete catalog product images" ON storage.objects;
CREATE POLICY "Product managers can delete catalog product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'catalog-product-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      LEFT JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND (up.is_admin = true OR perm.can_manage_products = true)
    )
  );
