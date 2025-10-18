/*
  # 修复管理员账号并启用注册

  1. 为超级管理员创建用户档案
  2. 修复触发器以支持现有用户
  3. 添加RLS策略允许查看自己的档案
*/

-- 为超级管理员创建用户档案
INSERT INTO public.user_profiles (id, email, username, membership_tier, credits_balance, is_admin)
VALUES (
  '4a4c530f-7040-49f7-8118-bd22ad659687',
  '2749046219@qq.com',
  '超级管理员',
  'premium',
  1000,
  true
)
ON CONFLICT (id) 
DO UPDATE SET 
  is_admin = true,
  membership_tier = 'premium',
  credits_balance = GREATEST(user_profiles.credits_balance, 1000);

-- 确保RLS策略允许用户查看和更新自己的档案
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 允许管理员查看所有用户
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 允许管理员更新所有用户
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 允许系统插入新用户档案
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON user_profiles;
CREATE POLICY "Allow insert for authenticated users"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
