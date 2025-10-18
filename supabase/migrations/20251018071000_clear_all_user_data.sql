/*
  # 清除所有用户相关数据

  1. 删除所有用户档案数据
  2. 删除所有交易记录
  3. 删除所有积分历史
  4. 保留表结构和RLS策略
*/

-- 删除所有积分历史记录
DELETE FROM credits_history;

-- 删除所有交易记录
DELETE FROM transactions;

-- 删除所有用户档案
DELETE FROM user_profiles;

-- 删除auth.users中的所有用户（这会级联删除相关数据）
DELETE FROM auth.users;
