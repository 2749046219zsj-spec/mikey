/*
  # 产品和提示词模板管理系统

  ## 1. 新建表
    - `product_categories` - 产品分类表
      - `id` (uuid, primary key)
      - `name` (text) - 产品名称（如：锌合金外壳香水瓶）
      - `display_name` (text) - 显示名称
      - `description` (text) - 产品描述
      - `sort_order` (integer) - 排序顺序
      - `is_active` (boolean) - 是否启用
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid) - 创建者
    
    - `prompt_templates` - 提示词模板表
      - `id` (uuid, primary key)
      - `product_category_id` (uuid) - 关联产品分类
      - `name` (text) - 模板名称
      - `prompt_content` (text) - 提示词内容
      - `prompt_type` (text) - 类型（craft/style/general）
      - `sort_order` (integer) - 排序顺序
      - `is_active` (boolean) - 是否启用
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid) - 创建者

  ## 2. 安全策略
    - 启用 RLS
    - 所有用户可以查看启用的产品和模板
    - 只有管理员可以创建、修改、删除

  ## 3. 说明
    - 支持动态管理产品类型
    - 支持为每个产品类型添加多个提示词模板
    - 管理员可以启用/禁用产品和模板
    - 自动记录创建和修改时间
*/

-- 创建产品分类表
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text DEFAULT '',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 创建提示词模板表
CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_category_id uuid REFERENCES product_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  prompt_content text NOT NULL,
  prompt_type text DEFAULT 'craft',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort ON product_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(product_category_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_sort ON prompt_templates(sort_order);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为产品分类表添加更新时间触发器
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON product_categories;
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为提示词模板表添加更新时间触发器
DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- 产品分类表 RLS 策略
CREATE POLICY "Anyone can view active product categories"
  ON product_categories FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert product categories"
  ON product_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update product categories"
  ON product_categories FOR UPDATE
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

CREATE POLICY "Admins can delete product categories"
  ON product_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 提示词模板表 RLS 策略
CREATE POLICY "Anyone can view active prompt templates"
  ON prompt_templates FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert prompt templates"
  ON prompt_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update prompt templates"
  ON prompt_templates FOR UPDATE
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

CREATE POLICY "Admins can delete prompt templates"
  ON prompt_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 插入初始产品分类数据
INSERT INTO product_categories (name, display_name, description, sort_order)
VALUES 
  ('zinc-alloy', '锌合金外壳香水瓶', '高档锌合金材质香水瓶', 1),
  ('leather', '皮革包裹香水瓶', '奢华皮革材质香水瓶', 2),
  ('glass', '玻璃渐变香水瓶', '时尚玻璃渐变设计', 3),
  ('metal-carved', '金属雕刻香水瓶', '精致金属雕刻工艺', 4),
  ('crystal', '水晶镶嵌香水瓶', '奢华水晶装饰', 5),
  ('ceramic', '陶瓷彩绘香水瓶', '艺术陶瓷手绘', 6)
ON CONFLICT (name) DO NOTHING;

-- 插入初始提示词模板（以锌合金为例）
INSERT INTO prompt_templates (product_category_id, name, prompt_content, prompt_type, sort_order)
SELECT 
  pc.id,
  '华丽花纹浮雕与烤漆',
  '在锌合金外壳上雕刻细腻的维多利亚时期流行的卷草纹、花卉图案，并辅以黑色或深色烤漆，在花纹节点处镶嵌微型水钻，营造出低调奢华感。',
  'craft',
  1
FROM product_categories pc WHERE pc.name = 'zinc-alloy'
ON CONFLICT DO NOTHING;

INSERT INTO prompt_templates (product_category_id, name, prompt_content, prompt_type, sort_order)
SELECT 
  pc.id,
  '镂空设计与点缀',
  '锌合金外壳采用部分镂空设计，露出下方瓶身，镂空部分边缘有维多利亚风格的蕾丝或藤蔓图案，并在镂空与实体连接处点缀小颗钻石，增加通透感。',
  'craft',
  2
FROM product_categories pc WHERE pc.name = 'zinc-alloy'
ON CONFLICT DO NOTHING;

INSERT INTO prompt_templates (product_category_id, name, prompt_content, prompt_type, sort_order)
SELECT 
  pc.id,
  '徽章式设计与烤漆',
  '在外壳正面设计一个凸起的盾形或椭圆形徽章，内部刻有维多利亚风格的家族纹章或花体字母，徽章周围是烤漆，徽章本身或其边缘镶嵌钻石。',
  'craft',
  3
FROM product_categories pc WHERE pc.name = 'zinc-alloy'
ON CONFLICT DO NOTHING;