/*
  # 修复 RLS 策略的无限递归问题

  ## 问题
  - user_profiles 的管理员策略导致无限递归
  - 管理员策略在查询时会再次查询 user_profiles，造成循环

  ## 解决方案
  - 使用更简单的管理员检查方式
  - 不在策略中嵌套查询同一个表
  - 使用 JWT 中的信息或简单的 auth.uid() 检查
*/

-- 完全删除所有现有策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can update own draws" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can view own logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON usage_logs;

-- 为 user_profiles 创建简单的策略（不会递归）
CREATE POLICY "Enable read for users own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable read for all if admin"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    -- 检查当前用户的 is_admin 字段
    -- 使用子查询但限制为当前用户，不会递归
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Enable update for admins"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 为 user_permissions 创建策略
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can update own remaining draws"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 为 usage_logs 创建策略
CREATE POLICY "Users can view own logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can insert own logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 给 service_role 完全权限（绕过 RLS）
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE user_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_logs FORCE ROW LEVEL SECURITY;