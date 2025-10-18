/*
  # 修复RLS策略中的无限递归问题

  1. 删除所有导致递归的策略
  2. 创建简单、无递归的策略
  3. 使用auth.uid()而不是子查询
*/

-- 删除所有现有策略
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own data" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own data" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_select_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_users_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "admins_select_all" ON user_profiles;
DROP POLICY IF EXISTS "admins_update_all" ON user_profiles;
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;

-- 确保RLS已启用
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 简单策略：允许所有已认证用户读取自己的档案
CREATE POLICY "allow_select_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 允许所有已认证用户更新自己的档案
CREATE POLICY "allow_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 允许所有已认证用户插入自己的档案
CREATE POLICY "allow_insert_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 修复packages表的RLS策略
DROP POLICY IF EXISTS "packages_select_all" ON packages;
DROP POLICY IF EXISTS "allow_read_packages" ON packages;

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_readable_by_all"
  ON packages
  FOR SELECT
  TO authenticated
  USING (true);

-- 修复其他表的RLS策略
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_insert_by_owner"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_select_by_owner"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 修复credits_history表的RLS策略
DROP POLICY IF EXISTS "credits_history_select_own" ON credits_history;
DROP POLICY IF EXISTS "credits_history_insert_own" ON credits_history;

ALTER TABLE credits_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credits_select_by_owner"
  ON credits_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "credits_insert_by_owner"
  ON credits_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 确保超级管理员档案存在
INSERT INTO user_profiles (id, email, username, membership_tier, credits_balance, is_admin)
VALUES (
  '4a4c530f-7040-49f7-8118-bd22ad659687',
  '2749046219@qq.com',
  '超级管理员',
  'premium',
  10000,
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  membership_tier = 'premium',
  credits_balance = GREATEST(user_profiles.credits_balance, 10000),
  username = '超级管理员',
  email = '2749046219@qq.com',
  updated_at = now();
