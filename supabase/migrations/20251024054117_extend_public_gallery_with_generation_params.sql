/*
  # 扩展公共画廊以支持生成参数和交互统计

  1. 新增字段
    - `model_name` (varchar): 使用的AI模型名称
    - `generation_params` (jsonb): 完整的生成参数JSON
    - `use_as_reference_count` (integer): 被用作参考图的次数
    - `remake_count` (integer): 做同款的次数
  
  2. 索引优化
    - 为model_name添加索引
    - 为统计字段添加索引
  
  3. 使用记录表
    - 创建gallery_usage_logs表记录用户交互行为
*/

-- 为public_gallery表添加新字段
ALTER TABLE public_gallery
ADD COLUMN IF NOT EXISTS model_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS generation_params JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS use_as_reference_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remake_count INTEGER DEFAULT 0;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_public_gallery_model ON public_gallery(model_name);
CREATE INDEX IF NOT EXISTS idx_public_gallery_remake_count ON public_gallery(remake_count DESC);

-- 添加注释
COMMENT ON COLUMN public_gallery.model_name IS 'AI模型名称';
COMMENT ON COLUMN public_gallery.generation_params IS '完整的生成参数JSON（包括style_preset, image_count等）';
COMMENT ON COLUMN public_gallery.use_as_reference_count IS '被用作参考图的次数';
COMMENT ON COLUMN public_gallery.remake_count IS '做同款的次数';

-- 创建使用记录表
CREATE TABLE IF NOT EXISTS gallery_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES public_gallery(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type VARCHAR(20) CHECK (action_type IN ('remake', 'use_as_reference')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 为使用记录表启用RLS
ALTER TABLE gallery_usage_logs ENABLE ROW LEVEL SECURITY;

-- 允许已认证用户创建使用记录
CREATE POLICY "Authenticated users can create usage logs"
  ON gallery_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 允许用户查看自己的使用记录
CREATE POLICY "Users can view own usage logs"
  ON gallery_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_gallery_usage_user ON gallery_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_usage_gallery ON gallery_usage_logs(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_usage_action ON gallery_usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_gallery_usage_created ON gallery_usage_logs(created_at DESC);

-- 创建函数：更新画廊图片的使用统计
CREATE OR REPLACE FUNCTION update_gallery_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action_type = 'remake' THEN
    UPDATE public_gallery
    SET remake_count = remake_count + 1
    WHERE id = NEW.gallery_id;
  ELSIF NEW.action_type = 'use_as_reference' THEN
    UPDATE public_gallery
    SET use_as_reference_count = use_as_reference_count + 1
    WHERE id = NEW.gallery_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_update_gallery_usage_stats ON gallery_usage_logs;
CREATE TRIGGER trigger_update_gallery_usage_stats
AFTER INSERT ON gallery_usage_logs
FOR EACH ROW
EXECUTE FUNCTION update_gallery_usage_stats();
