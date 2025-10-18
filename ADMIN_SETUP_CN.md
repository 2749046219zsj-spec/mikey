# 管理员账户设置指南

## 问题 1：管理员登录界面在哪里？

**答案：管理员和普通用户使用同一个登录界面！**

系统会自动识别用户身份：
- 普通用户登录 → 直接进入应用
- 管理员登录 → 可以访问"管理后台"

### 如何进入管理后台：

1. 使用管理员账户登录
2. 登录后，点击右上角的**"我的账户"**按钮
3. 在用户仪表板中，会看到**"管理后台"**按钮（仅管理员可见）
4. 点击进入管理控制台

## 问题 2：用户无法注册（Signups not allowed）

### 原因：
Supabase 默认可能禁用了邮箱注册功能。

### 解决步骤：

#### 步骤 1：登录 Supabase Dashboard
1. 访问：https://app.supabase.com
2. 使用您的 Supabase 账户登录
3. 选择您的项目

#### 步骤 2：启用邮箱注册
1. 在左侧菜单点击 **"Authentication"**
2. 点击 **"Providers"** 标签
3. 找到 **"Email"** 提供商
4. 确保以下设置：
   - ✅ **Enable Email provider** (开启)
   - ✅ **Enable Email Signups** (开启) ← 这是关键！
   - ⚠️ **Confirm email** (建议先关闭，方便测试)
5. 点击 **"Save"** 保存

#### 步骤 3：验证设置
1. 刷新您的应用
2. 尝试点击"立即注册"
3. 应该可以正常注册了

## 创建第一个管理员账户

### 方法 1：推荐方法（先注册后提升）

#### 1. 在应用中注册普通账户
```
用户名：admin
邮箱：admin@test.com （或您的真实邮箱）
密码：Admin123456 （至少6个字符）
```

#### 2. 提升为管理员
注册成功后，在 Supabase Dashboard 执行：

1. 点击左侧 **"SQL Editor"**
2. 点击 **"New query"**
3. 粘贴以下 SQL（替换邮箱为您注册的邮箱）：

```sql
-- 将用户提升为管理员
UPDATE user_profiles
SET is_admin = true
WHERE email = 'admin@test.com';
```

4. 点击 **"Run"** 执行
5. 看到 "Success. No rows returned" 表示成功

#### 3. 重新登录
1. 退出当前登录
2. 使用管理员账户重新登录
3. 点击"我的账户"
4. 应该能看到"管理后台"按钮了！

### 方法 2：直接在 Supabase 创建（备用方案）

如果注册仍有问题，可以直接在 Supabase 创建：

#### 1. 创建 Auth 用户
1. Supabase Dashboard → **"Authentication"** → **"Users"**
2. 点击 **"Add user"** → **"Create new user"**
3. 填写：
   - Email: `admin@test.com`
   - Password: `Admin123456`
   - ✅ **Auto Confirm User** (勾选)
4. 点击 **"Create user"**
5. 复制生成的 User ID（例如：`12345678-abcd-1234-abcd-123456789abc`）

#### 2. 创建用户资料
在 SQL Editor 执行（替换 User ID）：

```sql
-- 替换下面的 USER_ID 为实际的用户 ID
DO $$
DECLARE
  user_id_var uuid := '12345678-abcd-1234-abcd-123456789abc'; -- 替换这里！
BEGIN
  -- 创建用户 profile
  INSERT INTO user_profiles (id, username, email, is_active, is_admin)
  VALUES (user_id_var, 'admin', 'admin@test.com', true, true)
  ON CONFLICT (id) DO UPDATE SET is_admin = true;

  -- 创建用户权限
  INSERT INTO user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
  VALUES (user_id_var, 999, 999, true, 'full')
  ON CONFLICT (user_id) DO UPDATE
  SET draw_limit = 999,
      remaining_draws = 999,
      chat_assistant_enabled = true,
      app_access_level = 'full';
END $$;
```

## 支持的邮箱格式

系统支持所有标准邮箱格式：

✅ 正确格式：
- `user@example.com`
- `admin@test.com`
- `user123@qq.com`
- `user@gmail.com`
- `test.user@company.com`
- `user+tag@domain.co.uk`

❌ 错误格式：
- `user@` (缺少域名)
- `@example.com` (缺少用户名)
- `user@.com` (无效域名)
- `user space@example.com` (包含空格)

## 推荐的测试账户

### 管理员账户
```
邮箱：admin@test.com
密码：Admin123456
用户名：admin
权限：完整管理权限
```

### 普通用户账户
```
邮箱：user@test.com
密码：User123456
用户名：testuser
权限：5次绘图，基础访问
```

## 验证管理员权限

登录管理员账户后，应该能看到：

### 用户仪表板（我的账户）：
- ✅ 用户名和邮箱显示
- ✅ 剩余绘图次数（管理员可以设置为999）
- ✅ 客服助手状态（应该显示"已开启"）
- ✅ 访问级别（应该显示"完整访问"）
- ✅ **"管理后台"按钮**（管理员专属）

### 管理控制台：
- ✅ 用户管理标签
- ✅ 使用统计标签
- ✅ 所有用户列表
- ✅ 编辑按钮（可以修改用户权限）
- ✅ 启用/停用按钮

## 常见问题排查

### Q: 看不到"管理后台"按钮
**A**: 检查数据库中 `is_admin` 字段是否为 `true`

```sql
-- 查询用户的管理员状态
SELECT username, email, is_admin
FROM user_profiles
WHERE email = 'admin@test.com';
```

### Q: 登录时显示外键约束错误
**A**: 用户 profile 没有正确创建，使用方法 2 手动创建

### Q: 修改权限不生效
**A**:
1. 刷新页面
2. 重新登录
3. 检查 RLS 策略是否正确

### Q: 忘记管理员密码
**A**:
- 方法1：使用应用的"忘记密码"功能
- 方法2：Supabase Dashboard → Authentication → Users → 找到用户 → 手动重置密码

## 下一步操作

设置完成后，您可以：

1. **创建测试用户**：在应用中注册多个测试账户
2. **配置权限**：在管理后台给用户分配不同权限
3. **测试功能**：
   - 测试绘图次数限制
   - 测试客服助手开关
   - 测试访问级别控制
   - 测试账户启用/停用
4. **查看统计**：在"使用统计"标签查看用户活动

## 需要更多帮助？

如果遇到其他问题：

1. 检查浏览器控制台的错误信息
2. 检查 Supabase Dashboard 的 Logs
3. 确认数据库迁移已成功执行
4. 确认 RLS 策略已正确设置

---

**重要提示**：
- 管理员和普通用户用同一个登录界面
- 系统通过 `is_admin` 字段自动识别身份
- 第一次使用前必须先在 Supabase 开启邮箱注册功能
