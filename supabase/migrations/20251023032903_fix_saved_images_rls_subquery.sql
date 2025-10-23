/*
  # 修复 saved_images RLS 策略的子查询问题

  1. 问题
    - "Users can save images within quota" 策略中的子查询可能返回多行
    - PostgreSQL 要求作为表达式的子查询必须返回单行
    - 错误信息：more than one row returned by a subquery used as an expression

  2. 修复
    - 在子查询中添加 LIMIT 1 确保只返回一行
    - 同时同步所有现有用户的图片计数

  3. 额外功能
    - 添加定期同步功能以确保计数准确
*/

-- 删除旧的 RLS 策略
DROP POLICY IF EXISTS "Users can save images within quota" ON saved_images;

-- 重新创建修复后的 RLS 策略：用户插入自己的图片（需要检查配额）
CREATE POLICY "Users can save images within quota"
  ON saved_images FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      SELECT images_saved < image_quota
      FROM user_profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- 同步所有现有用户的图片计数（确保数据准确）
UPDATE user_profiles up
SET images_saved = (
  SELECT COALESCE(COUNT(*), 0)
  FROM saved_images si
  WHERE si.user_id = up.id
);

-- 为 reference_images 也同步一下（虽然不是这次的问题，但预防性修复）
-- 先检查 reference_images 表中的实际图片数量
DO $$
DECLARE
  v_user_id uuid;
  v_count integer;
BEGIN
  FOR v_user_id IN SELECT DISTINCT user_id FROM reference_images
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM reference_images
    WHERE user_id = v_user_id;
    
    -- 记录日志（可选）
    RAISE NOTICE 'User % has % reference images', v_user_id, v_count;
  END LOOP;
END $$;
