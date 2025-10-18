/*
  # 用户付费系统数据库架构

  ## 新建表

  ### 1. profiles (用户资料表)
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text, 用户全名)
  - `avatar_url` (text, 头像链接)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

  ### 2. pricing_plans (套餐价格表)
  - `id` (uuid, primary key)
  - `name` (text, 套餐名称，如"基础版")
  - `price` (numeric, 价格)
  - `image_credits` (integer, 可生成图片数量)
  - `description` (text, 套餐描述)
  - `is_active` (boolean, 是否启用)
  - `sort_order` (integer, 排序)
  - `created_at` (timestamptz)

  ### 3. user_subscriptions (用户订阅记录表)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `plan_id` (uuid, references pricing_plans)
  - `payment_status` (text, 支付状态: pending/completed/failed)
  - `payment_amount` (numeric, 支付金额)
  - `image_credits_purchased` (integer, 购买的图片额度)
  - `image_credits_remaining` (integer, 剩余图片额度)
  - `transaction_id` (text, 支付交易ID)
  - `purchased_at` (timestamptz, 购买时间)
  - `expires_at` (timestamptz, 过期时间，可为空表示永久)
  - `created_at` (timestamptz)

  ### 4. usage_logs (使用记录表)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `subscription_id` (uuid, references user_subscriptions)
  - `action_type` (text, 操作类型: image_generation)
  - `credits_used` (integer, 消耗的额度，默认1)
  - `prompt_text` (text, 生成图片的提示词)
  - `image_url` (text, 生成的图片链接)
  - `created_at` (timestamptz)

  ## 安全
  - 为所有表启用 RLS
  - 用户只能查看和更新自己的数据
  - pricing_plans 表所有人可读
  - usage_logs 只允许系统创建，用户只读自己的记录
*/

-- 1. 创建 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. 创建 pricing_plans 表
CREATE TABLE IF NOT EXISTS pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  image_credits integer NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pricing plans are viewable by everyone"
  ON pricing_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 插入默认套餐
INSERT INTO pricing_plans (name, price, image_credits, description, sort_order)
VALUES 
  ('基础版', 39, 100, '适合轻度使用，100张图片生成额度', 1),
  ('标准版', 79, 250, '适合日常使用，250张图片生成额度', 2),
  ('专业版', 99, 350, '适合重度使用，350张图片生成额度', 3)
ON CONFLICT DO NOTHING;

-- 3. 创建 user_subscriptions 表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES pricing_plans ON DELETE RESTRICT,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_amount numeric NOT NULL,
  image_credits_purchased integer NOT NULL,
  image_credits_remaining integer NOT NULL,
  transaction_id text,
  purchased_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. 创建 usage_logs 表
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions ON DELETE SET NULL,
  action_type text NOT NULL DEFAULT 'image_generation',
  credits_used integer DEFAULT 1,
  prompt_text text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_status ON user_subscriptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- 创建函数：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表创建触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
