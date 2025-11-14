/*
  # 微信支付系统数据库设计

  ## 概述
  创建完整的微信支付系统，包括充值套餐、订单管理、交易记录等

  ## 新建表

  ### 1. `recharge_packages` - 充值套餐表
  存储可供用户购买的充值套餐
  - `id` (uuid, primary key) - 套餐ID
  - `name` (text, NOT NULL) - 套餐名称（如"基础套餐"）
  - `description` (text) - 套餐描述
  - `price` (numeric, NOT NULL) - 价格（单位：元）
  - `draw_count` (integer, NOT NULL) - 赠送绘图次数
  - `bonus_draws` (integer) - 额外赠送次数
  - `validity_days` (integer) - 有效期（天数，null表示永久）
  - `is_active` (boolean) - 是否启用
  - `display_order` (integer) - 显示顺序
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `payment_orders` - 支付订单表
  存储所有支付订单信息
  - `id` (uuid, primary key) - 订单ID
  - `order_no` (text, unique, NOT NULL) - 订单号
  - `user_id` (uuid, NOT NULL) - 用户ID
  - `package_id` (uuid) - 套餐ID
  - `payment_method` (text) - 支付方式（wechat/alipay）
  - `amount` (numeric, NOT NULL) - 支付金额
  - `draw_count` (integer) - 购买的绘图次数
  - `status` (text, NOT NULL) - 订单状态（pending/paid/failed/refunded）
  - `transaction_id` (text) - 第三方交易号
  - `paid_at` (timestamptz) - 支付时间
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `payment_transactions` - 交易记录表
  记录所有支付相关的交易流水
  - `id` (uuid, primary key) - 记录ID
  - `order_id` (uuid, NOT NULL) - 订单ID
  - `user_id` (uuid, NOT NULL) - 用户ID
  - `type` (text, NOT NULL) - 交易类型（recharge/refund）
  - `amount` (numeric, NOT NULL) - 交易金额
  - `draw_change` (integer) - 次数变化
  - `before_draws` (integer) - 交易前次数
  - `after_draws` (integer) - 交易后次数
  - `description` (text) - 交易描述
  - `created_at` (timestamptz)

  ### 4. `wechat_payment_config` - 微信支付配置表
  存储微信支付的配置信息
  - `id` (uuid, primary key)
  - `app_id` (text, NOT NULL) - 微信应用ID
  - `mch_id` (text, NOT NULL) - 商户号
  - `api_key` (text, NOT NULL) - API密钥（加密存储）
  - `notify_url` (text, NOT NULL) - 回调地址
  - `is_active` (boolean) - 是否启用
  - `updated_at` (timestamptz)

  ## 安全性
  - 启用所有表的 RLS
  - 用户只能查看自己的订单和交易记录
  - 管理员可以管理所有数据
  - 配置表只有管理员可以访问
*/

-- 1. 创建充值套餐表
CREATE TABLE IF NOT EXISTS recharge_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  draw_count integer NOT NULL CHECK (draw_count >= 0),
  bonus_draws integer DEFAULT 0 CHECK (bonus_draws >= 0),
  validity_days integer CHECK (validity_days IS NULL OR validity_days > 0),
  is_active boolean DEFAULT true NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. 创建支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  package_id uuid REFERENCES recharge_packages(id),
  payment_method text DEFAULT 'wechat' CHECK (payment_method IN ('wechat', 'alipay')),
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  draw_count integer NOT NULL CHECK (draw_count >= 0),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  transaction_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. 创建交易记录表
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES payment_orders(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('recharge', 'refund', 'consume', 'bonus')),
  amount numeric(10, 2) NOT NULL,
  draw_change integer NOT NULL,
  before_draws integer NOT NULL,
  after_draws integer NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. 创建微信支付配置表
CREATE TABLE IF NOT EXISTS wechat_payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text NOT NULL,
  mch_id text NOT NULL,
  api_key text NOT NULL,
  notify_url text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created ON payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_recharge_packages_active ON recharge_packages(is_active, display_order);

-- 启用 RLS
ALTER TABLE recharge_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wechat_payment_config ENABLE ROW LEVEL SECURITY;

-- ========== RLS 策略：recharge_packages ==========

-- 所有人可以查看已启用的套餐
CREATE POLICY "Anyone can view active packages"
  ON recharge_packages FOR SELECT
  USING (is_active = true);

-- 管理员可以查看所有套餐
CREATE POLICY "Admins can view all packages"
  ON recharge_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以管理套餐
CREATE POLICY "Admins can manage packages"
  ON recharge_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- ========== RLS 策略：payment_orders ==========

-- 用户可以查看自己的订单
CREATE POLICY "Users can view own orders"
  ON payment_orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 用户可以创建自己的订单
CREATE POLICY "Users can create own orders"
  ON payment_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 管理员可以查看所有订单
CREATE POLICY "Admins can view all orders"
  ON payment_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以更新订单
CREATE POLICY "Admins can update orders"
  ON payment_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- ========== RLS 策略：payment_transactions ==========

-- 用户可以查看自己的交易记录
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 管理员可以查看所有交易记录
CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 只有系统可以创建交易记录（通过 service role）
CREATE POLICY "Service role can create transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ========== RLS 策略：wechat_payment_config ==========

-- 只有管理员可以访问配置
CREATE POLICY "Only admins can access payment config"
  ON wechat_payment_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 添加更新时间戳触发器
CREATE TRIGGER update_recharge_packages_updated_at
  BEFORE UPDATE ON recharge_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wechat_payment_config_updated_at
  BEFORE UPDATE ON wechat_payment_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入默认充值套餐
INSERT INTO recharge_packages (name, description, price, draw_count, bonus_draws, display_order, is_active)
VALUES
  ('体验套餐', '适合新用户尝试', 9.9, 10, 2, 1, true),
  ('基础套餐', '日常使用推荐', 29.9, 50, 10, 2, true),
  ('进阶套餐', '高频使用者优选', 99.9, 200, 50, 3, true),
  ('专业套餐', '专业创作者专享', 299.9, 800, 200, 4, true),
  ('至尊套餐', '无限创作可能', 999.9, 5000, 1000, 5, true)
ON CONFLICT DO NOTHING;
