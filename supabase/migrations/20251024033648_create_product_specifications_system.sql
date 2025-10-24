/*
  # 产品规格信息系统

  1. 新增表
    - `product_specifications` - 产品规格信息表
      - `id` (uuid, primary key)
      - `product_id` (uuid, 关联 public_reference_products)
      - `spec_name` (text, 规格名称，如"容量"、"总高度")
      - `spec_value` (text, 规格值，如"30毫升")
      - `display_order` (integer, 显示顺序)
      - `is_visible` (boolean, 是否显示)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, 创建者)

  2. 安全性
    - 启用 RLS
    - 游客和认证用户可查看可见的规格信息
    - 只有管理员可以创建、编辑、删除规格信息

  3. 索引
    - product_id 和 display_order 的组合索引，优化查询性能
*/

-- 创建产品规格表
CREATE TABLE IF NOT EXISTS product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public_reference_products(id) ON DELETE CASCADE,
  spec_name text NOT NULL,
  spec_value text NOT NULL,
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 启用 RLS
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- 游客和认证用户可以查看可见的规格
CREATE POLICY "Anyone can view visible specifications"
  ON product_specifications
  FOR SELECT
  USING (is_visible = true);

-- 管理员可以查看所有规格
CREATE POLICY "Admins can view all specifications"
  ON product_specifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以创建规格
CREATE POLICY "Admins can create specifications"
  ON product_specifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以更新规格
CREATE POLICY "Admins can update specifications"
  ON product_specifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以删除规格
CREATE POLICY "Admins can delete specifications"
  ON product_specifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_product_specs_product_order 
  ON product_specifications(product_id, display_order);

-- 创建更新时间戳触发器
CREATE OR REPLACE FUNCTION update_product_specifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_specifications_timestamp
  BEFORE UPDATE ON product_specifications
  FOR EACH ROW
  EXECUTE FUNCTION update_product_specifications_updated_at();
