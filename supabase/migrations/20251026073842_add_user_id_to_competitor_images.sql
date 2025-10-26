/*
  # 添加用户隔离到竞品图库

  1. 变更
    - 为 public_reference_images 表添加 user_id 字段
    - 关联到 auth.users 表
    - 更新 RLS 策略实现用户隔离
    - 为独立竞品图片（无 product_id）添加用户所有权

  2. 说明
    - 每个用户只能看到自己上传的竞品图片
    - 产品相关图片（有 product_id）仍然公开可见
    - 通过浏览器插件上传的图片必须关联到登录用户

  3. 安全
    - 用户只能查看自己的竞品图片
    - 用户只能删除自己的竞品图片
    - 用户只能上传到自己的竞品图库
*/

-- 添加 user_id 字段（允许 NULL 保持向后兼容）
ALTER TABLE public_reference_images
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_public_reference_images_user_id
  ON public_reference_images(user_id);

-- 删除旧的查看策略
DROP POLICY IF EXISTS "Anyone can view active standalone images" ON public_reference_images;

-- 创建新的查看策略：用户隔离的竞品图库
CREATE POLICY "Users can view their own competitor images"
  ON public_reference_images
  FOR SELECT
  USING (
    is_active = true AND (
      -- 情况1：产品相关图片（所有人可见）
      (product_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public_reference_products
        WHERE public_reference_products.id = public_reference_images.product_id
        AND public_reference_products.is_active = true
      ))
      OR
      -- 情况2：用户的竞品图片（只有自己可见）
      (product_id IS NULL AND user_id = auth.uid())
    )
  );

-- 创建插入策略：用户只能上传到自己的竞品图库
CREATE POLICY "Users can upload to their competitor library"
  ON public_reference_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 竞品图片必须关联到当前用户
    (product_id IS NULL AND user_id = auth.uid())
    OR
    -- 或者是管理员上传的产品图片
    (product_id IS NOT NULL)
  );

-- 创建更新策略：用户只能更新自己的竞品图片
CREATE POLICY "Users can update their own competitor images"
  ON public_reference_images
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 创建删除策略：用户只能删除自己的竞品图片
CREATE POLICY "Users can delete their own competitor images"
  ON public_reference_images
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 添加注释
COMMENT ON COLUMN public_reference_images.user_id IS '上传图片的用户ID，用于实现竞品图库的用户隔离';
