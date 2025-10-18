/*
  # 为新用户启用聊天功能

  1. 修改说明
    - 将新用户的默认访问级别从 'basic' 改为 'full'
    - 启用聊天助手功能
    - 这样普通用户登录后就能看到并使用聊天界面
  
  2. 影响范围
    - 更新 handle_new_user 函数，使新注册用户获得完整访问权限
    - 更新现有普通用户的权限
*/

-- 更新 handle_new_user 函数，为新用户提供完整访问权限
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username text;
BEGIN
  -- 生成用户名
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  
  -- 创建用户资料
  INSERT INTO user_profiles (id, username, email, is_active, is_admin)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 创建用户权限（给予完整访问权限和聊天助手）
  INSERT INTO user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
  VALUES (NEW.id, 999, 999, true, 'full')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新现有普通用户的权限（不包括管理员）
UPDATE user_permissions
SET 
  chat_assistant_enabled = true,
  app_access_level = 'full',
  draw_limit = 999,
  remaining_draws = 999
WHERE user_id IN (
  SELECT id FROM user_profiles WHERE is_admin = false
);