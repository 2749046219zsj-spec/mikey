/*
  # 自动确认用户邮箱 V2

  1. 功能说明
    - 创建一个触发器函数，在用户注册后自动确认邮箱
    - 这样用户注册后可以立即登录，无需邮箱验证
  
  2. 安全说明
    - 此功能适用于内部系统或不需要邮箱验证的应用
    - 如果需要邮箱验证，请删除此迁移
  
  3. 实现方式
    - 使用数据库触发器在 auth.users 表插入后自动更新 email_confirmed_at 字段
    - confirmed_at 是生成列，会自动计算，不需要手动设置
*/

-- 创建自动确认邮箱的触发器函数
CREATE OR REPLACE FUNCTION public.auto_confirm_user_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- 如果邮箱未确认，则自动确认
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

-- 创建新触发器
CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user_email();

-- 更新现有未确认的用户（如果有的话）
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;