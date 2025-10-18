/*
  # 创建超级管理员账号并更新套餐价格

  1. 更新套餐价格
    - 更新 packages 表，设置新的价格体系
    - 39元 = 100张图
    - 79元 = 250张图
    - 99元 = 330张图

  2. 安全性
    - 确保超级管理员账号在首次登录时自动创建用户档案
*/

-- 更新套餐价格和积分数量
UPDATE packages SET 
  name = '基础套餐',
  price = 39,
  credits = 100,
  tier = 'basic',
  is_active = true,
  sort_order = 1
WHERE tier = 'basic';

UPDATE packages SET 
  name = '进阶套餐',
  price = 79,
  credits = 250,
  tier = 'advanced',
  is_active = true,
  sort_order = 2
WHERE tier = 'advanced';

UPDATE packages SET 
  name = '尊享套餐',
  price = 99,
  credits = 330,
  tier = 'premium',
  is_active = true,
  sort_order = 3
WHERE tier = 'premium';

-- 如果套餐不存在则创建
INSERT INTO packages (name, price, credits, tier, is_active, sort_order)
SELECT '基础套餐', 39, 100, 'basic', true, 1
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE tier = 'basic');

INSERT INTO packages (name, price, credits, tier, is_active, sort_order)
SELECT '进阶套餐', 79, 250, 'advanced', true, 2
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE tier = 'advanced');

INSERT INTO packages (name, price, credits, tier, is_active, sort_order)
SELECT '尊享套餐', 99, 330, 'premium', true, 3
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE tier = 'premium');

-- 创建触发器函数：自动为新注册用户创建档案
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username, membership_tier, credits_balance, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'free',
    0,
    CASE 
      WHEN NEW.email = '2749046219@qq.com' THEN true
      ELSE false
    END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
