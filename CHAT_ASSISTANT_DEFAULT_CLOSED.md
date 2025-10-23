# 新用户客服助手默认状态设置

## 📋 需求说明

新注册的用户客服助手功能状态应该是**关闭状态**，而不是开启状态。

## ❌ 原来的问题

在之前的配置中，新注册用户的客服助手（Chat Assistant Widget）默认是**开启状态**：

```sql
-- 旧的 handle_new_user() 函数
INSERT INTO public.user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
VALUES (
  NEW.id,
  5,
  5,
  true,  -- ❌ 默认为 true（开启）
  'basic'
)
```

这导致：
- ✅ 新用户注册后立即看到客服助手窗口
- ❌ 可能造成界面干扰
- ❌ 不符合用户期望的默认行为

## ✅ 修复方案

### 1. 数据库 Migration

创建新的 migration 文件修改默认配置：

**文件：** `supabase/migrations/set_chat_assistant_default_closed.sql`

**主要修改：**

#### A. 更新 `handle_new_user()` 函数

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- 插入用户档案
  INSERT INTO public.user_profiles (id, username, email, is_active, is_admin, widget_is_open)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    true,
    false,
    false  -- widget 默认关闭
  )
  ON CONFLICT (id) DO NOTHING;

  -- 插入用户权限，客服助手默认关闭
  INSERT INTO public.user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
  VALUES (
    NEW.id,
    5,
    5,
    false,  -- ✅ 客服助手默认关闭
    'basic'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
```

#### B. 更新表的默认值

```sql
ALTER TABLE user_permissions
ALTER COLUMN chat_assistant_enabled SET DEFAULT false;
```

这确保了即使不通过 trigger 创建的记录，默认值也是 `false`。

### 2. 验证修改

执行以下 SQL 查询验证修改是否生效：

```sql
-- 查看列的默认值
SELECT
  column_name,
  column_default,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_permissions'
AND column_name = 'chat_assistant_enabled';

-- 结果应该显示：
-- column_default: "false"
```

```sql
-- 查看函数定义
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 应该包含：chat_assistant_enabled, false
```

## 📊 影响范围

### ✅ 会受到影响的：

1. **新注册用户**
   - 从此 migration 之后注册的所有新用户
   - `chat_assistant_enabled` 默认为 `false`
   - `widget_is_open` 默认为 `false`

2. **数据库默认值**
   - `user_permissions.chat_assistant_enabled` 列的默认值改为 `false`

### ❌ 不受影响的：

1. **已注册用户**
   - 所有已有用户的设置保持不变
   - 如果之前是开启状态，依然保持开启
   - 如果之前是关闭状态，依然保持关闭

2. **用户自定义设置**
   - 用户可以随时在个人中心开启或关闭客服助手
   - 管理员可以为特定用户启用客服助手功能

## 🔄 新用户注册流程

### 修复后的完整流程

```
1. 用户填写注册表单
   ↓
2. 提交注册请求
   ↓
3. Supabase Auth 创建新用户记录
   ↓
4. 触发 on_auth_user_created trigger
   ↓
5. 执行 handle_new_user() 函数
   ↓
6. 插入 user_profiles 记录
   - username: 用户名
   - email: 邮箱
   - is_active: true
   - is_admin: false
   - widget_is_open: false ✅
   ↓
7. 插入 user_permissions 记录
   - draw_limit: 5
   - remaining_draws: 5
   - chat_assistant_enabled: false ✅
   - app_access_level: 'basic'
   ↓
8. 用户登录成功
   ↓
9. 界面显示：客服助手窗口关闭 ✅
```

## 🎯 用户体验改进

### 修复前：
```
新用户注册 → 登录 → 看到客服助手窗口弹出 → 可能感到困扰
```

### 修复后：
```
新用户注册 → 登录 → 干净的界面 → 需要时可以手动开启客服助手
```

## 🔧 如何启用客服助手

### 用户端操作

用户可以通过以下方式启用客服助手：

1. **个人中心**
   - 进入"我的账户"
   - 找到"客服助手"设置
   - 点击开启按钮

2. **界面入口**（如果有的话）
   - 点击右下角的客服图标
   - 首次点击会自动开启并保存状态

### 管理员操作

管理员可以为特定用户启用客服助手：

1. 登录管理后台
2. 进入用户管理
3. 选择目标用户
4. 修改"客服助手"权限为"启用"

### 数据库操作（开发/运维）

```sql
-- 为特定用户启用客服助手
UPDATE user_permissions
SET chat_assistant_enabled = true
WHERE user_id = 'user-uuid-here';

-- 批量启用（如有需要，慎用）
UPDATE user_permissions
SET chat_assistant_enabled = true
WHERE app_access_level = 'premium';
```

## 📊 数据统计

可以使用以下查询查看客服助手的使用情况：

```sql
-- 统计客服助手启用状态
SELECT
  chat_assistant_enabled,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_permissions), 2) as percentage
FROM user_permissions
GROUP BY chat_assistant_enabled;

-- 查看最近注册用户的默认设置
SELECT
  up.username,
  up.email,
  up.created_at,
  perm.chat_assistant_enabled,
  up.widget_is_open
FROM user_profiles up
JOIN user_permissions perm ON up.id = perm.user_id
ORDER BY up.created_at DESC
LIMIT 10;
```

## 🧪 测试验证

### 测试步骤

1. **注册新用户**
   ```
   - 访问注册页面
   - 填写：用户名、邮箱、密码
   - 提交注册
   ```

2. **检查数据库**
   ```sql
   SELECT
     up.username,
     perm.chat_assistant_enabled,
     up.widget_is_open
   FROM user_profiles up
   JOIN user_permissions perm ON up.id = perm.user_id
   WHERE up.email = 'new-user@example.com';
   ```

   **期望结果：**
   - `chat_assistant_enabled`: `false` ✅
   - `widget_is_open`: `false` ✅

3. **登录检查界面**
   ```
   - 使用新账户登录
   - 查看界面
   ```

   **期望结果：**
   - 客服助手窗口不显示 ✅
   - 界面干净整洁 ✅

4. **手动启用测试**
   ```
   - 进入个人中心
   - 开启客服助手
   - 刷新页面
   ```

   **期望结果：**
   - 设置保存成功 ✅
   - 客服助手窗口显示 ✅
   - 下次登录仍然是开启状态 ✅

## 📝 相关文件

### 数据库 Migration
- `supabase/migrations/set_chat_assistant_default_closed.sql`

### 涉及的表
- `user_profiles`
  - `widget_is_open` 列：默认 `false`

- `user_permissions`
  - `chat_assistant_enabled` 列：默认 `false`

### 涉及的函数
- `handle_new_user()` - 用户注册触发器函数

### 涉及的触发器
- `on_auth_user_created` - 在 `auth.users` 表插入新记录时触发

## 🔒 安全性说明

### 权限控制

1. **函数权限**
   - `handle_new_user()` 使用 `SECURITY DEFINER`
   - 确保有足够权限插入 `user_profiles` 和 `user_permissions`

2. **RLS 策略**
   - 用户只能修改自己的 `widget_is_open` 状态
   - 只有管理员可以修改 `chat_assistant_enabled`

3. **默认值安全**
   - 默认关闭更安全，避免未授权使用
   - 用户需要主动启用才能使用

## ✅ 总结

本次修复通过以下方式实现：

1. ✅ 更新 `handle_new_user()` 函数，设置 `chat_assistant_enabled = false`
2. ✅ 更新表的默认值，确保一致性
3. ✅ 保持已有用户设置不变
4. ✅ 提供灵活的启用方式

**效果：**
- 新用户注册后客服助手默认关闭
- 界面更加干净整洁
- 用户可以按需启用
- 管理员可以批量管理

修改已经生效，下次有新用户注册时，客服助手将默认关闭！🎉
