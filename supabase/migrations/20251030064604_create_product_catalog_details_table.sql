/*
  # 创建产品详情表和权限扩展

  ## 概述
  为现有的 product_categories 添加详细的产品信息管理功能

  ## 新建表

  ### `catalog_products` - 产品详情表
  存储每个分类下的产品详细信息
  - `id` (uuid, primary key) - 产品ID
  - `category_id` (uuid, references product_categories) - 所属分类
  - `name` (text, NOT NULL) - 产品名称
  - `image_url` (text) - 产品主图
  - `size_specs` (text) - 尺寸规格
  - `inspiration` (text) - 创作灵感
  - `story` (text) - 故事情节
  - `description` (text) - 其他描述
  - `display_order` (integer) - 显示顺序
  - `is_active` (boolean) - 是否启用
  - `created_by` (uuid) - 创建人
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 权限扩展
  添加产品管理权限到 user_permissions

  ## 安全性
  - 启用 RLS
  - 所有人可查看已启用产品
  - 管理员和授权用户可管理
*/

-- 创建产品详情表
CREATE TABLE IF NOT EXISTS catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  image_url text DEFAULT '',
  size_specs text DEFAULT '',
  inspiration text DEFAULT '',
  story text DEFAULT '',
  description text DEFAULT '',
  display_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 添加产品管理权限
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_permissions' AND column_name = 'can_manage_products'
  ) THEN
    ALTER TABLE user_permissions ADD COLUMN can_manage_products boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog_products(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_active ON catalog_products(is_active);
CREATE INDEX IF NOT EXISTS idx_catalog_products_display_order ON catalog_products(display_order);

-- 启用 RLS
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已启用的产品
CREATE POLICY "Anyone can view active catalog products"
  ON catalog_products FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM product_categories
      WHERE product_categories.id = catalog_products.category_id
      AND product_categories.is_active = true
    )
  );

-- 管理员可以查看所有产品
CREATE POLICY "Admins can view all catalog products"
  ON catalog_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 具有产品管理权限的用户可以插入产品
CREATE POLICY "Product managers can insert catalog products"
  ON catalog_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND (up.is_admin = true OR perm.can_manage_products = true)
    )
  );

-- 具有产品管理权限的用户可以更新产品
CREATE POLICY "Product managers can update catalog products"
  ON catalog_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN user_permissions perm ON up.id = perm.user_id
      WHERE up.id = auth.uid()
      AND (up.is_admin = true OR perm.can_manage_products = true)
    )
  );

-- 管理员可以删除产品
CREATE POLICY "Admins can delete catalog products"
  ON catalog_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_catalog_products_updated_at ON catalog_products;
CREATE TRIGGER update_catalog_products_updated_at
  BEFORE UPDATE ON catalog_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();