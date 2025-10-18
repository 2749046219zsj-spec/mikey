/*
  # 添加用户审批和管理员系统

  ## 更新表结构

  ### 1. profiles 表添加字段
  - `is_admin` (boolean, 是否管理员)
  - `is_approved` (boolean, 是否已审批)
  - `approval_status` (text, 审批状态: pending/approved/rejected)
  - `free_credits_granted` (boolean, 是否已发放免费额度)

  ### 2. 更新 user_subscriptions 表
  - 添加字段 `qr_code_url` (text, 支付二维码URL)

  ## 功能
  - 新用户注册后默认获得20次免费额度
  - 管理员可以审批用户
  - 管理员可以管理用户额度
  - 管理员可以注销用户

  ## 安全
  - 管理员权限检查
  - 用户必须经过审批才能使用
*/

-- 1. 为 profiles 表添加新字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN approval_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'free_credits_granted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN free_credits_granted boolean DEFAULT false;
  END IF;
END $$;

-- 2. 为 user_subscriptions 表添加二维码URL字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'qr_code_url'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN qr_code_url text;
  END IF;
END $$;

-- 3. 创建函数：自动为新用户创建20次免费额度
CREATE OR REPLACE FUNCTION grant_free_credits_to_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查是否已经发放过免费额度
  IF NOT NEW.free_credits_granted THEN
    -- 创建免费订阅记录
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      payment_status,
      payment_amount,
      image_credits_purchased,
      image_credits_remaining,
      transaction_id,
      purchased_at
    )
    SELECT
      NEW.id,
      (SELECT id FROM pricing_plans WHERE price = 0 LIMIT 1),
      'completed',
      0,
      20,
      20,
      'FREE_REGISTRATION',
      now()
    WHERE NOT EXISTS (
      SELECT 1 FROM user_subscriptions 
      WHERE user_id = NEW.id AND transaction_id = 'FREE_REGISTRATION'
    );

    -- 标记已发放
    NEW.free_credits_granted = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
DROP TRIGGER IF EXISTS trigger_grant_free_credits ON profiles;
CREATE TRIGGER trigger_grant_free_credits
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION grant_free_credits_to_new_user();

-- 5. 添加免费套餐（如果不存在）
INSERT INTO pricing_plans (name, price, image_credits, description, is_active, sort_order)
VALUES ('注册赠送', 0, 20, '新用户注册免费赠送20次绘图额度', true, 0)
ON CONFLICT DO NOTHING;

-- 6. 添加管理员相关 RLS 策略
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update all subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- 7. 创建管理员视图（用于统计）
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.is_approved,
  p.approval_status,
  p.created_at,
  COALESCE(SUM(us.image_credits_remaining), 0) as total_credits,
  COALESCE(COUNT(DISTINCT ul.id), 0) as total_usage
FROM profiles p
LEFT JOIN user_subscriptions us ON p.id = us.user_id AND us.payment_status = 'completed'
LEFT JOIN usage_logs ul ON p.id = ul.user_id
WHERE p.is_admin = false
GROUP BY p.id, p.email, p.full_name, p.is_approved, p.approval_status, p.created_at;

-- 8. 为管理员创建查看统计的权限
GRANT SELECT ON admin_user_stats TO authenticated;
