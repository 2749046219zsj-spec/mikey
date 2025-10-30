/*
  # 为新用户默认开启产品目录权限

  ## 概述
  更新用户注册触发器，为新注册用户默认开启产品目录管理权限

  ## 修改内容
  1. 更新 handle_new_user() 函数
     - 在创建用户权限时，默认设置 can_manage_catalog = true
  
  2. 更新现有用户权限
     - 为所有现有用户开启产品目录权限

  ## 安全性
  - 保持现有的安全策略不变
  - 仅修改默认权限设置
*/

-- 更新用户注册函数，添加产品目录权限
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

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
  
  -- 插入用户权限（默认开启产品目录权限）
  INSERT INTO public.user_permissions (
    user_id, 
    draw_limit, 
    remaining_draws, 
    chat_assistant_enabled, 
    app_access_level,
    can_edit_public_database,
    can_manage_catalog
  )
  VALUES (
    NEW.id, 
    5, 
    5, 
    true, 
    'basic',
    false,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- 为所有现有用户开启产品目录权限
UPDATE user_permissions 
SET can_manage_catalog = true 
WHERE can_manage_catalog IS NULL OR can_manage_catalog = false;
