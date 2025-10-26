/*
  # 更新公共参考图片表以支持独立竞品图片
  
  1. 变更
    - 修改 public_reference_images 表结构
    - 将 product_id 改为可选（允许NULL）
    - 添加新字段支持独立图片：
      - name (图片名称)
      - category (分类标签)
      - tags (标签数组)
      - metadata (元数据JSON)
    - 更新RLS策略以支持独立图片查看
  
  2. 说明
    - 支持两种模式：关联产品的图片 和 独立的竞品图片
    - 浏览器扩展上传的图片作为独立图片存储
    - 保持向后兼容性
*/

-- 修改 product_id 为可选
ALTER TABLE public_reference_images 
  ALTER COLUMN product_id DROP NOT NULL;

-- 添加新字段
ALTER TABLE public_reference_images 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'competitor',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_public_reference_images_category 
  ON public_reference_images(category);
CREATE INDEX IF NOT EXISTS idx_public_reference_images_tags 
  ON public_reference_images USING gin(tags);

-- 删除旧的查看策略
DROP POLICY IF EXISTS "Anyone can view active images" ON public_reference_images;

-- 创建新的查看策略，支持独立图片
CREATE POLICY "Anyone can view active standalone images"
  ON public_reference_images
  FOR SELECT
  USING (
    is_active = true AND (
      -- 独立图片（无product_id）
      product_id IS NULL
      OR
      -- 关联产品的图片（产品必须启用）
      EXISTS (
        SELECT 1 FROM public_reference_products
        WHERE public_reference_products.id = public_reference_images.product_id
        AND public_reference_products.is_active = true
      )
    )
  );
