/*
  # 修复用户注册触发器问题
  
  1. 问题说明
    - 新注册用户没有自动创建 user_profiles 和 user_permissions 记录
    - 导致用户无法正常登录使用
  
  2. 解决方案
    - 重新创建 handle_new_user() 函数，增加错误处理
    - 为现有未创建档案的用户补充数据
    - 确保触发器正常工作
  
  3. 修复内容
    - 修复函数权限和错误处理
    - 补充历史数据
*/

-- 删除旧函数和触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 重新创建函数，增加错误处理和日志
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- 插入用户档案
  INSERT INTO public.user_profiles (id, username, email, is_active, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    true,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- 插入用户权限
  INSERT INTO public.user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
  VALUES (
    NEW.id, 
    5, 
    5, 
    true, 
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

-- 重新创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- 为现有用户补充缺失的档案和权限数据
INSERT INTO public.user_profiles (id, username, email, is_active, is_admin)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  u.email,
  true,
  false
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 为现有用户补充缺失的权限数据
INSERT INTO public.user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
SELECT 
  u.id,
  5,
  5,
  true,
  'basic'
FROM auth.users u
LEFT JOIN public.user_permissions perm ON u.id = perm.user_id
WHERE perm.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
