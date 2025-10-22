/*
  # 创建公共参考图片系统

  1. 新表
    - `public_reference_products` (公共参考产品表)
      - `id` (uuid, 主键)
      - `title` (text, 产品标题)
      - `product_code` (text, 货号, 唯一)
      - `category_id` (uuid, 分类ID, 关联product_categories)
      - `description` (text, 描述)
      - `sort_order` (integer, 排序)
      - `is_active` (boolean, 是否启用)
      - `created_at` (timestamptz, 创建时间)
      - `updated_at` (timestamptz, 更新时间)
      - `created_by` (uuid, 创建者)

    - `public_reference_images` (公共参考图片表)
      - `id` (uuid, 主键)
      - `product_id` (uuid, 关联public_reference_products)
      - `image_url` (text, 图片URL)
      - `thumbnail_url` (text, 缩略图URL, 可选)
      - `file_name` (text, 文件名)
      - `display_order` (integer, 显示顺序)
      - `is_active` (boolean, 是否启用)
      - `created_at` (timestamptz, 创建时间)
      - `updated_at` (timestamptz, 更新时间)
      - `created_by` (uuid, 创建者)

  2. 安全
    - 启用所有表的RLS
    - 所有用户可以读取启用的公共参考图片
    - 只有管理员可以创建、更新和删除公共参考图片

  3. 索引
    - product_code唯一索引
    - product_id外键索引
    - category_id外键索引
*/

-- 创建公共参考产品表
CREATE TABLE IF NOT EXISTS public_reference_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  product_code text UNIQUE NOT NULL,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  description text DEFAULT '',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 创建公共参考图片表
CREATE TABLE IF NOT EXISTS public_reference_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public_reference_products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  thumbnail_url text,
  file_name text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_public_reference_products_category 
  ON public_reference_products(category_id);
CREATE INDEX IF NOT EXISTS idx_public_reference_products_active 
  ON public_reference_products(is_active);
CREATE INDEX IF NOT EXISTS idx_public_reference_images_product 
  ON public_reference_images(product_id);
CREATE INDEX IF NOT EXISTS idx_public_reference_images_active 
  ON public_reference_images(is_active);

-- 启用RLS
ALTER TABLE public_reference_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_reference_images ENABLE ROW LEVEL SECURITY;

-- 公共参考产品RLS策略
CREATE POLICY "Anyone can view active public products"
  ON public_reference_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all public products"
  ON public_reference_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert public products"
  ON public_reference_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update public products"
  ON public_reference_products FOR UPDATE
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

CREATE POLICY "Admins can delete public products"
  ON public_reference_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 公共参考图片RLS策略
CREATE POLICY "Anyone can view active public images"
  ON public_reference_images FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public_reference_products
      WHERE public_reference_products.id = public_reference_images.product_id
      AND public_reference_products.is_active = true
    )
  );

CREATE POLICY "Admins can view all public images"
  ON public_reference_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert public images"
  ON public_reference_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update public images"
  ON public_reference_images FOR UPDATE
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

CREATE POLICY "Admins can delete public images"
  ON public_reference_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );