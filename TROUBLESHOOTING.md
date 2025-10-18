# 问题排查指南

## 已解决的问题

### ✅ 问题1：注册时显示 "Signups not allowed"

**原因**：Supabase 默认禁用了邮箱注册

**解决方法**：
1. 登录 Supabase Dashboard: https://app.supabase.com
2. 选择您的项目
3. Authentication → Providers → Email
4. 确保勾选：
   - ✅ Enable Email provider
   - ✅ **Enable Email Signups** ← 关键设置
5. 点击 Save

### ✅ 问题2：注册时显示 "Failed to create user: Database error creating new user"

**原因**：数据库中存在旧的 `profiles` 表与新的 `user_profiles` 表冲突

**解决方法**：已通过迁移自动修复
- 删除了旧的 `profiles` 表及相关对象
- 改进了 `handle_new_user()` 函数，添加了错误处理
- 添加了 `fix_missing_user_profiles()` 函数自动修复缺失的用户资料

**验证修复**：
```sql
-- 在 Supabase SQL Editor 中运行
SELECT * FROM user_profiles;
SELECT * FROM user_permissions;
```

### ✅ 问题3：登录时显示外键约束错误

**原因**：`usage_logs` 表引用了不存在的 `user_profiles` 记录

**解决方法**：
1. 已修复触发器，确保注册时自动创建所有必要记录
2. 添加了 `ON CONFLICT DO NOTHING` 防止重复插入
3. 使用 `fix_missing_user_profiles()` 函数修复现有用户

**手动修复（如果需要）**：
```sql
-- 运行修复函数
SELECT fix_missing_user_profiles();
```

## 当前系统状态

### 数据库表结构

#### 1. user_profiles（用户资料）
```
- id (uuid) - 主键，关联 auth.users
- username (text) - 用户名，唯一
- email (text) - 邮箱
- is_active (boolean) - 账户是否启用
- is_admin (boolean) - 是否管理员
- created_at (timestamptz) - 创建时间
- updated_at (timestamptz) - 更新时间
```

#### 2. user_permissions（用户权限）
```
- id (uuid) - 主键
- user_id (uuid) - 关联 user_profiles，唯一
- draw_limit (integer) - 总绘图次数
- remaining_draws (integer) - 剩余绘图次数
- chat_assistant_enabled (boolean) - 客服助手开关
- app_access_level (text) - 访问级别（basic/full）
- updated_at (timestamptz) - 更新时间
```

#### 3. usage_logs（使用日志）
```
- id (uuid) - 主键
- user_id (uuid) - 关联 user_profiles
- action_type (text) - 操作类型
- details (jsonb) - 详细信息
- created_at (timestamptz) - 创建时间
```

### 自动化机制

#### 新用户注册流程
1. 用户在应用中注册
2. Supabase Auth 创建 `auth.users` 记录
3. 触发器 `on_auth_user_created` 自动执行
4. 函数 `handle_new_user()` 自动创建：
   - `user_profiles` 记录（用户资料）
   - `user_permissions` 记录（默认权限）
5. 用户立即可以登录使用

#### 默认权限配置
```
- 绘图次数：5次
- 访问级别：basic（基础）
- 客服助手：关闭
```

## 如何测试系统

### 测试1：注册新用户
```
步骤：
1. 在应用中点击"立即注册"
2. 填写：
   - 用户名：testuser
   - 邮箱：test@example.com
   - 密码：Test123456

预期结果：
✅ 注册成功
✅ 自动登录
✅ 显示剩余5次绘图机会
✅ 可以访问基础功能
```

### 测试2：创建管理员
```
步骤：
1. 注册一个普通账户（例如：admin@test.com）
2. 在 Supabase SQL Editor 执行：
   UPDATE user_profiles
   SET is_admin = true
   WHERE email = 'admin@test.com';
3. 退出并重新登录

预期结果：
✅ 登录后看到"我的账户"按钮
✅ 点击进入仪表板
✅ 看到"管理后台"按钮
✅ 可以访问管理控制台
```

### 测试3：管理用户权限
```
步骤：
1. 以管理员身份登录
2. 进入管理后台
3. 找到任一用户
4. 点击编辑按钮
5. 修改权限并保存

预期结果：
✅ 可以修改绘图次数
✅ 可以开关客服助手
✅ 可以切换访问级别
✅ 可以启用/停用账户
```

## 常见错误及解决方法

### 错误：注册时无响应
**可能原因**：
1. Email Signups 未启用
2. 网络连接问题
3. Supabase 服务异常

**解决方法**：
1. 检查 Supabase Dashboard 设置
2. 打开浏览器控制台查看错误
3. 检查网络连接

### 错误：登录后看不到数据
**可能原因**：
1. RLS 策略未正确配置
2. 用户资料未创建

**解决方法**：
```sql
-- 检查用户是否有 profile
SELECT u.id, u.email, up.username
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'your@email.com';

-- 如果没有，运行修复
SELECT fix_missing_user_profiles();
```

### 错误：管理员看不到"管理后台"按钮
**可能原因**：
1. is_admin 字段未设置为 true
2. 需要重新登录

**解决方法**：
```sql
-- 检查管理员状态
SELECT username, email, is_admin
FROM user_profiles
WHERE email = 'your@email.com';

-- 设置为管理员
UPDATE user_profiles
SET is_admin = true
WHERE email = 'your@email.com';
```

### 错误：外键约束违规
**可能原因**：
1. user_profiles 记录缺失
2. 触发器执行失败

**解决方法**：
```sql
-- 运行修复函数
SELECT fix_missing_user_profiles();

-- 验证修复
SELECT
  u.id,
  u.email,
  up.id as profile_id,
  uperm.id as permissions_id
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN user_permissions uperm ON u.id = uperm.user_id;
```

## 有用的 SQL 查询

### 查看所有用户及其权限
```sql
SELECT
  up.username,
  up.email,
  up.is_admin,
  up.is_active,
  uperm.draw_limit,
  uperm.remaining_draws,
  uperm.chat_assistant_enabled,
  uperm.app_access_level
FROM user_profiles up
JOIN user_permissions uperm ON up.id = uperm.user_id
ORDER BY up.created_at DESC;
```

### 查看用户活动日志
```sql
SELECT
  up.username,
  ul.action_type,
  ul.created_at
FROM usage_logs ul
JOIN user_profiles up ON ul.user_id = up.id
ORDER BY ul.created_at DESC
LIMIT 50;
```

### 批量设置管理员
```sql
-- 将特定邮箱设置为管理员
UPDATE user_profiles
SET is_admin = true
WHERE email IN ('admin1@test.com', 'admin2@test.com');
```

### 重置用户绘图次数
```sql
-- 重置所有用户的绘图次数为5次
UPDATE user_permissions
SET remaining_draws = draw_limit;

-- 重置特定用户
UPDATE user_permissions
SET remaining_draws = 10
WHERE user_id = (
  SELECT id FROM user_profiles WHERE email = 'user@test.com'
);
```

## 系统维护

### 定期检查
1. 检查是否有用户缺少 profile 或 permissions
2. 检查使用日志大小（定期清理旧日志）
3. 监控异常错误

### 清理旧日志（可选）
```sql
-- 删除30天前的日志
DELETE FROM usage_logs
WHERE created_at < NOW() - INTERVAL '30 days';
```

## 获取更多帮助

如果问题仍未解决：

1. **查看浏览器控制台**：F12 → Console 标签
2. **查看 Supabase Logs**：Dashboard → Logs
3. **检查数据库状态**：Dashboard → Database → Tables
4. **验证 RLS 策略**：Dashboard → Database → Policies

## 联系支持

需要更多帮助时，请提供：
1. 错误截图
2. 浏览器控制台的错误信息
3. 尝试的步骤
4. Supabase 项目 ID（不要分享 API Keys！）
