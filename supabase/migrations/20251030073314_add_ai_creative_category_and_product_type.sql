/*
  # 添加AI创意作品类目和产品类型过滤

  1. 新增内容
    - 在 product_categories 表中添加"AI创意作品"类目
    - 在 public_gallery 表中添加 product_type 字段用于过滤
    - 添加索引以提升查询性能

  2. 功能说明
    - AI创意作品类目将展示用户上传到画廊的AI生成图片
    - product_type 字段关联到产品类别名称（如 'square', 'zinc-alloy' 等）
    - 支持按产品类型筛选画廊图片

  3. 安全措施
    - 保持原有RLS策略不变
    - 添加的字段允许为NULL以兼容现有数据
*/

-- 添加AI创意作品类目
INSERT INTO product_categories (name, display_name, description, sort_order, is_active)
VALUES (
  'ai-creative-works',
  'AI创意作品',
  '浏览社区用户分享的AI创意作品，按产品类型筛选查看',
  -1,  -- 排在第一位
  true
)
ON CONFLICT (name) DO NOTHING;

-- 在 public_gallery 表中添加 product_type 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_gallery' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE public_gallery ADD COLUMN product_type text;
  END IF;
END $$;

-- 添加索引以提升按产品类型查询的性能
CREATE INDEX IF NOT EXISTS idx_public_gallery_product_type 
  ON public_gallery(product_type) 
  WHERE product_type IS NOT NULL;

-- 添加组合索引以优化排序查询
CREATE INDEX IF NOT EXISTS idx_public_gallery_product_type_created_at 
  ON public_gallery(product_type, created_at DESC) 
  WHERE product_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_gallery_product_type_likes 
  ON public_gallery(product_type, likes_count DESC) 
  WHERE product_type IS NOT NULL;
