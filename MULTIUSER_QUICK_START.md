# 多用户系统快速入门指南

## 🚀 5分钟快速启动

### 第一步：数据库已配置完成 ✓

数据库迁移已自动执行，包括：
- ✅ user_images 表（用户图片）
- ✅ user_image_tags 表（图片标签）
- ✅ user-images Storage Bucket
- ✅ 完整的 RLS 安全策略
- ✅ 自动更新配额的触发器

### 第二步：配置浏览器插件

1. **复制配置文件**
```bash
cd browser-extension
cp config.example.json config.json
```

2. **编辑 config.json**（已包含正确配置）
```json
{
  "supabaseUrl": "https://tvghcqbgktwummwjiexp.supabase.co",
  "supabaseAnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "competitorUploadEndpoint": "https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload",
  "enabled": true
}
```

### 第三步：安装插件

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `browser-extension` 文件夹

### 第四步：测试多用户功能

#### 测试用户注册
1. 点击插件图标
2. 点击"没有账号？注册"
3. 填写信息：
   - 用户名: `testuser1`
   - 邮箱: `test1@example.com`
   - 密码: `123456`
4. 点击"注册"按钮

#### 测试用户登录
1. 注册成功后会自动跳转到登录页
2. 输入刚才注册的邮箱和密码
3. 点击"登录"按钮
4. 看到"我的图库"界面即登录成功

#### 测试图片上传
1. 点击"上传图片"按钮，选择图片上传
2. 或者右键点击网页上的任意图片
3. 选择"上传到我的图库"
4. 等待上传完成通知

#### 测试图片删除
1. 在"我的图库"中查看已上传的图片
2. 点击图片下方的"删除"按钮
3. 确认删除
4. 配额自动释放

### 第五步：测试数据隔离

1. 退出当前账号
2. 注册第二个测试账号：
   - 用户名: `testuser2`
   - 邮箱: `test2@example.com`
   - 密码: `123456`
3. 登录第二个账号
4. 确认看不到第一个账号的图片 ✓

## 📊 功能清单

### 已实现功能
- [x] 用户注册和登录
- [x] JWT 认证和 Session 管理
- [x] 个人图片库管理
- [x] 浏览器插件集成
- [x] 右键菜单快速上传
- [x] 存储配额管理（默认100MB）
- [x] 自动更新配额
- [x] 图片删除和配额释放
- [x] 完全的数据隔离
- [x] Row Level Security 保护
- [x] Storage 访问控制

### 功能对比

| 功能 | 竞品图库 | 个人图库 |
|------|---------|---------|
| 需要登录 | ❌ | ✅ |
| 数据隔离 | ❌ (所有人可见) | ✅ (完全隔离) |
| 存储配额 | ❌ | ✅ (100MB/用户) |
| 图片管理 | 仅上传 | 上传+删除+查看 |
| 右键上传 | ✅ | ✅ |

## 🔒 安全特性

### 已实现的安全措施

1. **认证安全**
   - JWT Token 认证
   - 密码自动加密（bcrypt）
   - Session 自动管理
   - 1小时自动过期

2. **数据隔离**
   - RLS 策略强制隔离
   - 用户只能访问自己的数据
   - Storage 按用户ID分文件夹
   - 数据库级别的权限控制

3. **输入验证**
   - 文件类型验证（仅图片）
   - 文件大小限制（10MB）
   - 存储配额检查
   - SQL 注入防护（Supabase 内置）

4. **访问控制**
   - 所有API需要认证
   - Storage 文件权限控制
   - 无法访问其他用户文件
   - 无法修改其他用户数据

## 📝 常用命令

### 数据库查询

```sql
-- 查看所有用户
SELECT id, username, email, storage_used_mb, storage_quota_mb
FROM user_profiles;

-- 查看用户图片
SELECT ui.*, up.username
FROM user_images ui
JOIN user_profiles up ON ui.user_id = up.id
ORDER BY ui.created_at DESC;

-- 查看存储使用排行
SELECT
  username,
  storage_used_mb,
  storage_quota_mb,
  ROUND((storage_used_mb / storage_quota_mb * 100)::numeric, 2) as usage_percent
FROM user_profiles
ORDER BY storage_used_mb DESC
LIMIT 10;
```

### 管理员操作

```sql
-- 调整用户配额为 500MB
UPDATE user_profiles
SET storage_quota_mb = 500
WHERE username = 'testuser1';

-- 清空用户的所有图片（仅元数据）
DELETE FROM user_images
WHERE user_id = (
  SELECT id FROM user_profiles WHERE username = 'testuser1'
);
```

## 🐛 故障排查

### 问题1: 上传失败
**症状**: 点击上传没有反应或显示错误

**解决方案**:
1. 检查是否已登录
2. 检查 config.json 配置是否正确
3. 打开开发者工具查看错误信息
4. 检查存储配额是否已满

### 问题2: 看不到图片
**症状**: 图片列表为空

**解决方案**:
1. 点击"刷新"按钮
2. 检查是否登录了正确的账号
3. 确认已上传过图片

### 问题3: 无法登录
**症状**: 输入正确的邮箱密码仍然登录失败

**解决方案**:
1. 确认密码至少6位
2. 检查网络连接
3. 查看 Supabase Dashboard 中的认证日志
4. 确认用户邮箱已确认（默认自动确认）

### 问题4: 配额未更新
**症状**: 删除图片后配额没有释放

**解决方案**:
1. 检查触发器是否存在：
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_user_storage_usage';
```

2. 手动更新配额：
```sql
UPDATE user_profiles
SET storage_used_mb = (
  SELECT COALESCE(SUM(file_size_bytes::decimal / 1024 / 1024), 0)
  FROM user_images
  WHERE user_id = user_profiles.id
);
```

## 📞 技术支持

### 相关文档
- [完整系统指南](./MULTIUSER_SYSTEM_GUIDE.md) - 详细的技术文档
- [Supabase 文档](https://supabase.com/docs) - 官方文档
- [Chrome 扩展文档](https://developer.chrome.com/docs/extensions/) - 插件开发

### 日志位置
- Chrome 扩展日志: 开发者工具 > Console
- Supabase 日志: Dashboard > Logs
- 网络请求: 开发者工具 > Network

## 🎉 完成！

恭喜！你已经成功部署了一个完整的多用户图片管理系统。

**下一步建议**:
- 测试不同用户的数据隔离
- 上传一些测试图片
- 尝试调整用户配额
- 监控存储使用情况
- 根据需求扩展功能
