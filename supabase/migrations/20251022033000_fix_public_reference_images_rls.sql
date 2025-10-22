/*
  # 修复公共参考图片RLS策略

  1. 问题
    - 现有RLS策略使用子查询检查管理员权限
    - 可能导致权限检查失败

  2. 解决方案
    - 删除所有现有策略
    - 创建更简单直接的策略
    - 使用 security definer 函数来检查管理员权限

  3. 变更
    - 创建辅助函数检查是否为管理员
    - 重新创建所有RLS策略
*/

-- 创建辅助函数检查是否为管理员
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- 删除 public_reference_products 表的所有现有策略
DROP POLICY IF EXISTS "Anyone can view active public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can view all public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can insert public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can update public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can delete public products" ON public_reference_products;

-- 删除 public_reference_images 表的所有现有策略
DROP POLICY IF EXISTS "Anyone can view active public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can view all public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can insert public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can update public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can delete public images" ON public_reference_images;

-- 重新创建 public_reference_products 的 RLS 策略
CREATE POLICY "Anyone can view active products"
  ON public_reference_products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON public_reference_products
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON public_reference_products
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON public_reference_products
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON public_reference_products
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- 重新创建 public_reference_images 的 RLS 策略
CREATE POLICY "Anyone can view active images"
  ON public_reference_images
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public_reference_products
      WHERE public_reference_products.id = public_reference_images.product_id
      AND public_reference_products.is_active = true
    )
  );

CREATE POLICY "Admins can view all images"
  ON public_reference_images
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert images"
  ON public_reference_images
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update images"
  ON public_reference_images
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete images"
  ON public_reference_images
  FOR DELETE
  TO authenticated
  USING (is_admin());
