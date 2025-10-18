# 用户认证系统使用指南

## 功能概述

已为您的项目添加完整的用户认证系统，包含以下功能：

### 1. 用户认证功能
- ✅ 注册（邮箱 + 密码）
- ✅ 登录（邮箱 + 密码）
- ✅ 登出
- ✅ 忘记密码
- ✅ 重置密码
- ✅ 自动创建用户资料

### 2. 角色权限系统 (RBAC)
- **user** - 普通用户（默认）
- **vip** - VIP用户
- **admin** - 管理员

### 3. 受保护页面
- `/dashboard` - 所有已登录用户可访问
- `/chat` - 您原有的聊天功能（需登录）
- `/admin` - 仅管理员可访问

### 4. 管理后台
- 查看所有用户列表
- 修改用户角色
- 实时更新

### 5. 速率限制
已部署 Edge Function 用于 API 速率限制：
- 登录：5次/分钟
- 注册：3次/分钟
- 重置密码：3次/5分钟
- 默认：100次/分钟

### 6. 统一错误处理
- 友好的错误提示
- 网络错误处理
- 认证错误处理

## 路由结构

```
/                    → 重定向到 /dashboard
/login              → 登录页面
/register           → 注册页面
/forgot-password    → 忘记密码
/reset-password     → 重置密码
/dashboard          → 用户主页（需登录）
/chat               → AI聊天页面（需登录，您的原有功能）
/admin              → 管理面板（需admin角色）
/unauthorized       → 无权限页面
```

## 数据库结构

### 表
1. **profiles** - 用户资料
   - id, email, full_name, avatar_url
   - role (user/vip/admin)
   - created_at, updated_at

2. **user_roles** - 用户角色
   - user_id, role
   - created_at, updated_at

3. **rate_limits** - 速率限制记录
   - user_id, endpoint, request_count
   - window_start

### 安全策略 (RLS)
- 用户只能查看/修改自己的资料
- 管理员可以查看/修改所有用户
- 角色修改仅限管理员

## 如何使用

### 1. 注册第一个管理员
注册后，在 Supabase Dashboard 中手动将该用户角色设置为 admin：

```sql
-- 在 Supabase SQL Editor 中执行
UPDATE user_roles
SET role = 'admin'
WHERE user_id = 'YOUR_USER_ID';

UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

### 2. 使用管理面板
登录后访问 `/admin` 可管理其他用户的角色。

### 3. 在代码中使用认证

```typescript
import { useAuth } from '../contexts/AuthContext';

function YourComponent() {
  const { user, signOut } = useAuth();

  // 获取当前用户信息
  console.log(user?.email);
  console.log(user?.role); // 'user' | 'vip' | 'admin'

  // 登出
  await signOut();
}
```

### 4. 调用速率限制

```typescript
import { checkRateLimit } from '../utils/rateLimit';

const { allowed, retryAfter } = await checkRateLimit('/api/auth/login');
if (!allowed) {
  console.log(`请等待 ${retryAfter} 秒后重试`);
}
```

## 原有功能保留

您的所有原有聊天功能都已完整保留：
- AI聊天界面
- 图片上传和分析
- 消息历史
- 模型选择
- 批量绘图队列
- 客服弹窗

现在这些功能都需要用户登录后才能访问，增强了安全性。

## 注意事项

1. **邮箱验证默认关闭** - 用户注册后可直接登录
2. **密码要求** - 最少6个字符
3. **会话管理** - 自动处理，无需手动刷新
4. **错误处理** - 所有API错误都会显示友好提示

## 下一步建议

1. 在 Supabase Dashboard 设置第一个管理员
2. 测试注册/登录流程
3. 根据需求调整速率限制配置
4. 自定义用户资料字段（如头像上传）
5. 添加更多VIP专属功能
