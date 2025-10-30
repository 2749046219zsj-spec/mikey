/*
  # 统一产品目录权限字段名称

  ## 问题
  - 数据库中使用 `can_manage_products` 
  - 前端代码使用 `can_manage_catalog`
  - 需要统一使用 `can_manage_catalog` 作为标准字段名

  ## 修改
  1. 更新 RLS 策略，使用 `can_manage_catalog` 字段
  2. 保持数据库中已有的权限值不变

  ## 安全性
  - 不影响现有数据
  - 保持 RLS 安全策略
*/

-- 更新 catalog_products 表的 INSERT 策略
DROP POLICY IF EXISTS "Product managers can insert catalog products" ON catalog_products;
CREATE POLICY "Product managers can insert catalog products"
  ON catalog_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND (
        up.is_admin = true 
        OR perm.can_manage_products = true 
        OR perm.can_manage_catalog = true
      )
    )
  );

-- 更新 catalog_products 表的 UPDATE 策略
DROP POLICY IF EXISTS "Product managers can update catalog products" ON catalog_products;
CREATE POLICY "Product managers can update catalog products"
  ON catalog_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND (
        up.is_admin = true 
        OR perm.can_manage_products = true 
        OR perm.can_manage_catalog = true
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND (
        up.is_admin = true 
        OR perm.can_manage_products = true 
        OR perm.can_manage_catalog = true
      )
    )
  );

-- 更新有权限管理用户的 SELECT 策略
CREATE POLICY "Product managers can view all catalog products"
  ON catalog_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND (
        up.is_admin = true 
        OR perm.can_manage_products = true 
        OR perm.can_manage_catalog = true
      )
    )
  );
