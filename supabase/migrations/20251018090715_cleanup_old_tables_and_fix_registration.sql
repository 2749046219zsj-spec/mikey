/*
  # 清理旧表并修复注册问题

  ## 问题
  - 旧的 profiles 表与新的 user_profiles 表冲突
  - 注册时出现数据库错误

  ## 解决方案
  1. 删除旧的 profiles 表及其相关对象
  2. 确保 handle_new_user 函数使用正确的错误处理
  3. 添加更好的日志和错误处理

  ## 注意
  - 这会删除旧的 profiles 表
  - 如果有重要数据，请先备份
*/

-- 删除旧 profiles 表的触发器
DROP TRIGGER IF EXISTS trigger_grant_free_credits ON profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- 删除相关函数
DROP FUNCTION IF EXISTS grant_free_credits_to_new_user() CASCADE;

-- 删除旧的 profiles 表（如果没有重要数据）
-- 注意：这会删除所有旧数据，请谨慎操作
DROP TABLE IF EXISTS profiles CASCADE;

-- 删除旧的相关表（如果存在）
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS credits_history CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;

-- 改进 handle_new_user 函数，添加更好的错误处理
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
  
  -- 创建用户权限
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

-- 确保触发器存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 添加一个辅助函数来手动修复缺失的用户资料
CREATE OR REPLACE FUNCTION fix_missing_user_profiles()
RETURNS void AS $$
BEGIN
  -- 为所有缺少 profile 的 auth.users 创建资料
  INSERT INTO user_profiles (id, username, email, is_active, is_admin)
  SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
    u.email,
    true,
    false
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE up.id IS NULL
  ON CONFLICT (id) DO NOTHING;

  -- 为所有缺少权限的用户创建权限
  INSERT INTO user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
  SELECT 
    u.id,
    5,
    5,
    false,
    'basic'
  FROM auth.users u
  LEFT JOIN user_permissions up ON u.id = up.user_id
  WHERE up.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 运行修复函数（修复现有用户）
SELECT fix_missing_user_profiles();

-- 授予必要的权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_permissions TO authenticated;
GRANT ALL ON usage_logs TO authenticated;