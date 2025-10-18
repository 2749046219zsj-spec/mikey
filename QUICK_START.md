# 快速开始指南

## 重要：必须先完成 Supabase 配置

### 第一步：启用用户注册

**问题**：您看到 "Signups not allowed for this instance" 错误

**解决方法**：

1. 登录您的 Supabase Dashboard: https://app.supabase.com
2. 选择您的项目
3. 点击左侧菜单 "Authentication"
4. 点击 "Providers" 或 "Settings"
5. 找到 "Email Auth" 部分
6. **确保以下选项已开启**：
   - ✅ Enable Email provider
   - ✅ Enable Email Signups (允许邮箱注册)
   - ✅ Confirm email（可选，建议先关闭以方便测试）
7. 点击 "Save" 保存

### 第二步：创建第一个管理员账户

#### 方法 A：通过应用注册后提升为管理员（推荐）

1. 完成第一步后，在应用中点击"立即注册"
2. 填写信息创建一个账户，例如：
   - 用户名: `admin`
   - 邮箱: `admin@yourdomain.com`
   - 密码: `admin123456`（自己设定一个安全的密码）
3. 注册成功后，前往 Supabase Dashboard
4. 点击左侧 "SQL Editor"
5. 运行以下 SQL（替换为您的邮箱）:

```sql
-- 将用户提升为管理员
UPDATE user_profiles
SET is_admin = true
WHERE email = 'admin@yourdomain.com';
```

6. 退出登录，重新登录即可看到"管理后台"按钮

#### 方法 B：直接在数据库创建管理员（高级）

如果注册仍然有问题，可以通过 Supabase Dashboard 直接创建：

1. 在 Supabase Dashboard 点击 "Authentication" → "Users"
2. 点击 "Add user"
3. 选择 "Create new user"
4. 填写信息：
   - Email: `admin@yourdomain.com`
   - Password: `admin123456`（设定密码）
   - Auto Confirm User: ✅ 勾选
5. 创建后，到 "SQL Editor" 运行：

```sql
-- 查找刚创建的用户ID
SELECT id, email FROM auth.users WHERE email = 'admin@yourdomain.com';

-- 假设返回的 id 是: 12345678-1234-1234-1234-123456789abc
-- 手动创建 profile 和 permissions

INSERT INTO user_profiles (id, username, email, is_active, is_admin)
VALUES (
  '12345678-1234-1234-1234-123456789abc',  -- 替换为实际的用户ID
  'admin',
  'admin@yourdomain.com',
  true,
  true
);

INSERT INTO user_permissions (user_id, draw_limit, remaining_draws, chat_assistant_enabled, app_access_level)
VALUES (
  '12345678-1234-1234-1234-123456789abc',  -- 替换为实际的用户ID
  999,
  999,
  true,
  'full'
);
```

### 第三步：测试登录

1. 使用创建的管理员账户登录
2. 应该能看到：
   - 右上角显示剩余绘图次数
   - "我的账户"按钮
3. 点击"我的账户"，应该能看到：
   - "管理后台"按钮（管理员专属）
4. 点击"管理后台"进入管理界面

## 常见问题

### Q1: 为什么不能注册？

**A**: Supabase 默认可能禁用了邮箱注册。请按照第一步启用 Email Signups。

### Q2: 管理员和普通用户用同一个登录界面吗？

**A**: 是的！系统自动识别：
- 普通用户登录后直接进入应用
- 管理员登录后可以点击"我的账户"→"管理后台"进入管理界面

### Q3: 如何区分管理员？

**A**: 数据库中 `user_profiles` 表的 `is_admin` 字段为 `true` 的就是管理员。

### Q4: 登录时出现外键约束错误

**A**: 这是因为 user_profiles 没有正确创建。确保：
1. 触发器正常工作（已在迁移中创建）
2. 或者按照方法 B 手动创建 profile

### Q5: 邮箱格式要求

**A**: 支持所有标准邮箱格式：
- `user@example.com`
- `user@qq.com`
- `user@gmail.com`
- `user123@domain.co.uk`
- 等等

### Q6: 忘记管理员密码怎么办？

**A**:
1. 使用应用的"忘记密码"功能重置
2. 或在 Supabase Dashboard → Authentication → Users 中找到该用户，手动重置密码

## 推荐的管理员账户

为了方便测试，建议创建：

- **邮箱**: `admin@test.com` 或您自己的真实邮箱
- **密码**: 至少6个字符，例如 `Admin@123456`
- **用户名**: `admin`

## 验证系统是否正常

### 测试清单：

1. ✅ 能够注册新用户
2. ✅ 新用户默认有5次绘图机会
3. ✅ 能够登录
4. ✅ 普通用户能看到自己的权限信息
5. ✅ 管理员能看到"管理后台"按钮
6. ✅ 管理员能查看所有用户
7. ✅ 管理员能编辑用户权限
8. ✅ 管理员能启用/停用用户

## 需要帮助？

如果以上步骤仍然无法解决问题，请检查：

1. Supabase 项目的 URL 和 API Key 是否正确配置在 `.env` 文件
2. 数据库迁移是否成功执行（在 Supabase Dashboard → Database → Migrations 查看）
3. RLS 策略是否已启用（在 Supabase Dashboard → Database → Policies 查看）

## 下一步

系统启动后，您可以：
1. 创建更多测试用户
2. 在管理后台配置用户权限
3. 查看使用统计
4. 测试绘图功能的权限控制
