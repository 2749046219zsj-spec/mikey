/*
  # 最终修复 RLS 策略 - 使用 SECURITY DEFINER 函数

  ## 策略
  - 使用 SECURITY DEFINER 函数绕过 RLS 检查管理员权限
  - 这样可以避免递归问题
*/

-- 删除所有现有策略
DROP POLICY IF EXISTS "Enable read for users own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read for all if admin" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can update own remaining draws" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can view own logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can read all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can update own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update any permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can read own logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins can read all logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON usage_logs;
DROP POLICY IF EXISTS "System can insert logs" ON usage_logs;

-- 创建 SECURITY DEFINER 函数来检查管理员状态（绕过 RLS）
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
DECLARE
  admin_status boolean;
BEGIN
  SELECT is_admin INTO admin_status
  FROM user_profiles
  WHERE id = check_user_id;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- user_profiles 策略
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- user_permissions 策略
CREATE POLICY "Users read own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users update own permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins update all permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- usage_logs 策略
CREATE POLICY "Users read own logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 确保 RLS 启用
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- 授予权限
GRANT EXECUTE ON FUNCTION is_admin TO authenticated, anon;
GRANT USAGE ON SCHEMA public TO authenticated, anon;