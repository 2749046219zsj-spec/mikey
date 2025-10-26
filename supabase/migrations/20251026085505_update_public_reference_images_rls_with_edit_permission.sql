/*
  # 更新公共参考图片RLS策略，使用编辑权限控制
  
  1. 变更
    - 删除旧的插入和删除策略
    - 创建新的策略，检查用户的 can_edit_public_database 权限
    - 管理员和拥有编辑权限的用户可以上传和删除公共参考图片
  
  2. 安全说明
    - 所有用户仍可查看启用的公共参考图片
    - 只有管理员或被授权的用户可以编辑
    - 竞品图库也使用相同的权限控制
*/

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Admins can insert images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can update images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can delete images" ON public_reference_images;

-- 创建新的插入策略：管理员或拥有编辑权限的用户可以插入
CREATE POLICY "Authorized users can insert public reference images"
  ON public_reference_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 用户是管理员
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    -- 用户拥有公共数据库编辑权限
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 创建新的更新策略：管理员或拥有编辑权限的用户可以更新
CREATE POLICY "Authorized users can update public reference images"
  ON public_reference_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 创建新的删除策略：管理员或拥有编辑权限的用户可以删除
CREATE POLICY "Authorized users can delete public reference images"
  ON public_reference_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
      AND user_permissions.can_edit_public_database = true
    )
  );

-- 添加注释
COMMENT ON POLICY "Authorized users can insert public reference images" ON public_reference_images 
  IS '管理员或拥有编辑权限的用户可以插入公共参考图片';
COMMENT ON POLICY "Authorized users can update public reference images" ON public_reference_images 
  IS '管理员或拥有编辑权限的用户可以更新公共参考图片';
COMMENT ON POLICY "Authorized users can delete public reference images" ON public_reference_images 
  IS '管理员或拥有编辑权限的用户可以删除公共参考图片';
