/*
  # 设置新用户客服助手默认关闭
  
  1. 问题说明
    - 当前新注册用户的客服助手（chat_assistant_enabled）默认为开启状态（true）
    - 需要改为默认关闭状态（false）
  
  2. 修改内容
    - 更新 handle_new_user() 函数，将 chat_assistant_enabled 默认值改为 false
    - 更新 user_permissions 表的默认值
  
  3. 影响范围
    - 仅影响新注册用户
    - 已注册用户的设置保持不变
*/

-- 更新 handle_new_user 函数，设置 chat_assistant_enabled 默认为 false
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- 插入用户档案
  INSERT INTO public.user_profiles (id, username, email, is_active, is_admin, widget_is_open)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    true,
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 插入用户权限，客服助手默认关闭
  INSERT INTO public.user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
  VALUES (
    NEW.id, 
    5, 
    5, 
    false,  -- 客服助手默认关闭
    'basic'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 更新 user_permissions 表的默认值
ALTER TABLE user_permissions 
ALTER COLUMN chat_assistant_enabled SET DEFAULT false;

-- 注释：已有用户的 chat_assistant_enabled 设置保持不变
-- 如果需要批量修改已有用户，可以运行以下命令（当前已注释）：
-- UPDATE user_permissions SET chat_assistant_enabled = false WHERE chat_assistant_enabled = true;
