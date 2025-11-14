/*
  # 更新产品图片存储删除策略 - 管理员全权限

  ## 概述
  允许管理员删除任何用户上传的产品图片，不受文件夹限制

  ## 变更
  - 更新删除策略，管理员可以删除所有图片
  - 产品管理权限用户只能删除自己上传的图片
  - 新增管理员无限制删除策略
*/

-- 删除旧的删除策略
DROP POLICY IF EXISTS "Product managers can delete catalog product images" ON storage.objects;

-- 管理员可以删除任何产品图片（无限制）
CREATE POLICY "Admins can delete any catalog product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'catalog-product-images'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 产品管理权限的用户可以删除自己上传的图片
CREATE POLICY "Product managers can delete own catalog product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'catalog-product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      LEFT JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND perm.can_manage_products = true
    )
  );
