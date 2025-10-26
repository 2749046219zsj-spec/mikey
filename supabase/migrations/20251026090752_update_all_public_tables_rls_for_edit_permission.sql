/*
  # 更新所有公共数据表的RLS策略，支持编辑权限
  
  1. 变更
    - 更新 public_reference_products 表的 RLS 策略
    - 更新 product_specifications 表的 RLS 策略
    - 允许拥有 can_edit_public_database 权限的用户进行所有编辑操作
  
  2. 影响范围
    - 产品表（public_reference_products）
    - 产品规格表（product_specifications）
    - 公共参考图片表（已在之前的迁移中更新）
  
  3. 安全说明
    - 管理员和有编辑权限的用户可以进行 CRUD 操作
    - 普通用户仍然可以查看公开的数据
*/

-- ============================================
-- 更新 public_reference_products 表的 RLS 策略
-- ============================================

-- 删除旧的管理员专用策略
DROP POLICY IF EXISTS "Admins can view all products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can insert products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can update products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can delete products" ON public_reference_products;

-- 创建新的插入策略
CREATE POLICY "Authorized users can insert products"
  ON public_reference_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 管理员
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    -- 拥有编辑权限的用户
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 创建新的更新策略
CREATE POLICY "Authorized users can update products"
  ON public_reference_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 创建新的删除策略
CREATE POLICY "Authorized users can delete products"
  ON public_reference_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- ============================================
-- 更新 product_specifications 表的 RLS 策略
-- ============================================

-- 删除旧的管理员专用策略
DROP POLICY IF EXISTS "Admins can view all specifications" ON product_specifications;
DROP POLICY IF EXISTS "Admins can create specifications" ON product_specifications;
DROP POLICY IF EXISTS "Admins can update specifications" ON product_specifications;
DROP POLICY IF EXISTS "Admins can delete specifications" ON product_specifications;

-- 创建新的插入策略
CREATE POLICY "Authorized users can create specifications"
  ON product_specifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 创建新的更新策略
CREATE POLICY "Authorized users can update specifications"
  ON product_specifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 创建新的删除策略
CREATE POLICY "Authorized users can delete specifications"
  ON product_specifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 添加注释
COMMENT ON POLICY "Authorized users can insert products" ON public_reference_products 
  IS '管理员或拥有编辑权限的用户可以创建产品';
COMMENT ON POLICY "Authorized users can update products" ON public_reference_products 
  IS '管理员或拥有编辑权限的用户可以更新产品';
COMMENT ON POLICY "Authorized users can delete products" ON public_reference_products 
  IS '管理员或拥有编辑权限的用户可以删除产品';

COMMENT ON POLICY "Authorized users can create specifications" ON product_specifications 
  IS '管理员或拥有编辑权限的用户可以创建规格';
COMMENT ON POLICY "Authorized users can update specifications" ON product_specifications 
  IS '管理员或拥有编辑权限的用户可以更新规格';
COMMENT ON POLICY "Authorized users can delete specifications" ON product_specifications 
  IS '管理员或拥有编辑权限的用户可以删除规格';
