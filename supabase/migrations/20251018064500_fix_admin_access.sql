/*
  # 修复管理员访问问题

  1. 完全重建RLS策略
  2. 使用更简单的逻辑
  3. 确保管理员账号可以访问
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

-- 确保表启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 策略1: 所有已认证用户可以读取自己的档案
CREATE POLICY "select_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 策略2: 所有已认证用户可以更新自己的档案
CREATE POLICY "update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 策略3: 所有已认证用户可以插入自己的档案
CREATE POLICY "insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 确保超级管理员存在且正确配置
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
  email = '2749046219@qq.com';

-- 确保packages表的RLS策略允许所有已认证用户读取
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packages_select_all" ON packages;
CREATE POLICY "packages_select_all"
  ON packages
  FOR SELECT
  TO authenticated
  USING (true);

-- 确保transactions表的RLS策略
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 确保credits_history表的RLS策略
ALTER TABLE credits_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credits_history_select_own" ON credits_history;
CREATE POLICY "credits_history_select_own"
  ON credits_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "credits_history_insert_own" ON credits_history;
CREATE POLICY "credits_history_insert_own"
  ON credits_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
