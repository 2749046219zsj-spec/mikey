/*
  # 重置默认用户权限

  1. 修改说明
    - 将新用户的默认设置改为：绘图次数 5 次，聊天助手未开启，访问级别基础
    - 只有管理员才有完整访问权限和聊天助手
  
  2. 默认权限
    - draw_limit: 5
    - remaining_draws: 5
    - chat_assistant_enabled: false
    - app_access_level: 'basic'
*/

-- 更新 handle_new_user 函数，为新用户提供基础权限
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
  
  -- 创建用户权限（基础权限：5次绘图，无聊天助手）
  INSERT INTO user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
  VALUES (NEW.id, 5, 5, false, 'basic')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 重置普通用户的权限（不包括管理员）
UPDATE user_permissions
SET 
  chat_assistant_enabled = false,
  app_access_level = 'basic',
  draw_limit = 5,
  remaining_draws = 5
WHERE user_id IN (
  SELECT id FROM user_profiles WHERE is_admin = false
);