# 多用户图片管理系统完整指南

## 系统概述

这是一个完整的多用户图片管理系统，包含：
- 用户注册/登录认证
- 个人图片库管理
- 浏览器插件集成
- 存储配额管理
- 严格的数据隔离

## 一、系统架构

### 技术栈
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **前端**: React + TypeScript
- **插件**: Chrome Extension
- **认证**: Supabase Auth (JWT)
- **存储**: Supabase Storage (10GB)

### 数据库表结构

#### 1. user_profiles (用户配置表)
```sql
- id: UUID (关联 auth.users)
- username: TEXT (唯一用户名)
- email: TEXT (邮箱)
- avatar_url: TEXT (头像URL)
- storage_quota_mb: INTEGER (存储配额, 默认100MB)
- storage_used_mb: DECIMAL (已使用存储)
- is_active: BOOLEAN (是否激活)
- is_admin: BOOLEAN (是否管理员)
- created_at: TIMESTAMPTZ (创建时间)
- updated_at: TIMESTAMPTZ (更新时间)
```

#### 2. user_images (用户图片表)
```sql
- id: UUID (主键)
- user_id: UUID (用户ID)
- file_name: TEXT (文件名)
- file_path: TEXT (存储路径)
- file_size_bytes: BIGINT (文件大小)
- mime_type: TEXT (MIME类型)
- storage_bucket: TEXT (存储桶名称)
- thumbnail_url: TEXT (缩略图URL)
- image_url: TEXT (图片URL)
- upload_source: TEXT (上传来源)
- metadata: JSONB (元数据)
- created_at: TIMESTAMPTZ (创建时间)
- updated_at: TIMESTAMPTZ (更新时间)
```

#### 3. user_image_tags (图片标签表)
```sql
- id: UUID (主键)
- user_id: UUID (用户ID)
- image_id: UUID (图片ID)
- tag_name: TEXT (标签名称)
- created_at: TIMESTAMPTZ (创建时间)
```

### Storage 结构
```
user-images/
  ├── {user_id}/
  │   ├── timestamp_random.jpg
  │   ├── timestamp_random.png
  │   └── ...
```

## 二、安全机制

### Row Level Security (RLS) 策略

所有表都启用了 RLS，确保严格的数据隔离：

```sql
-- 用户只能查看自己的图片
CREATE POLICY "用户只能查看自己的图片"
  ON user_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 用户只能上传到自己的图库
CREATE POLICY "用户只能上传到自己的图库"
  ON user_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的图片
CREATE POLICY "用户只能删除自己的图片"
  ON user_images FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Storage 策略

```sql
-- 用户只能访问自己文件夹下的文件
CREATE POLICY "用户只能访问自己的图片文件"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 三、用户注册与登录

### 注册流程

1. 用户填写表单（用户名、邮箱、密码）
2. 系统创建 auth.users 记录
3. 触发器自动创建 user_profiles 记录
4. 自动分配 100MB 存储配额

```javascript
const { data, error } = await supabaseClient.auth.signUp({
  email,
  password,
  options: {
    data: {
      username: username
    }
  }
});
```

### 登录流程

1. 用户提供邮箱和密码
2. Supabase 验证凭据并返回 JWT
3. JWT 保存到 chrome.storage
4. 后续请求自动携带 JWT

```javascript
const { data, error } = await supabaseClient.auth.signInWithPassword({
  email,
  password
});

await chrome.storage.local.set({
  session: data.session,
  user: data.user
});
```

## 四、图片上传流程

### 1. 检查用户权限
```javascript
// 验证登录状态
const { session, user } = await chrome.storage.local.get(['session', 'user']);
if (!session) throw new Error('未登录');
```

### 2. 检查存储配额
```javascript
const { data: profile } = await supabaseClient
  .from('user_profiles')
  .select('storage_quota_mb, storage_used_mb')
  .eq('id', user.id)
  .single();

const fileSizeMB = file.size / (1024 * 1024);
if (profile.storage_used_mb + fileSizeMB > profile.storage_quota_mb) {
  throw new Error('存储空间不足');
}
```

### 3. 上传文件到 Storage
```javascript
const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

const { error } = await supabaseClient
  .storage
  .from('user-images')
  .upload(fileName, file);
```

### 4. 保存元数据到数据库
```javascript
const { data: { publicUrl } } = supabaseClient
  .storage
  .from('user-images')
  .getPublicUrl(fileName);

await supabaseClient
  .from('user_images')
  .insert({
    user_id: user.id,
    file_name: file.name,
    file_path: fileName,
    file_size_bytes: file.size,
    mime_type: file.type,
    image_url: publicUrl,
    thumbnail_url: publicUrl,
    storage_bucket: 'user-images',
    upload_source: 'browser-extension'
  });
```

### 5. 更新存储使用量

通过数据库触发器自动更新：

```sql
CREATE TRIGGER trigger_update_user_storage_usage
  AFTER INSERT OR DELETE ON user_images
  FOR EACH ROW
  EXECUTE FUNCTION update_user_storage_usage();
```

## 五、浏览器插件配置

### 文件结构
```
browser-extension/
  ├── manifest.json
  ├── config.json                    # 配置文件
  ├── popup-multiuser.html           # 多用户版弹窗
  ├── popup-multiuser.js             # 多用户版逻辑
  ├── background-multiuser.js        # 多用户版后台
  ├── popup.css                      # 样式文件
  └── icons/                         # 图标文件
```

### config.json 配置

```json
{
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseAnonKey": "your-anon-key",
  "competitorUploadEndpoint": "https://your-project.supabase.co/functions/v1/competitor-image-upload",
  "enabled": true
}
```

### manifest.json 配置

需要添加以下权限：

```json
{
  "permissions": [
    "contextMenus",
    "notifications",
    "storage"
  ],
  "host_permissions": [
    "https://*.supabase.co/*",
    "<all_urls>"
  ]
}
```

## 六、使用指南

### 插件安装

1. 打开 Chrome 扩展管理页面 (`chrome://extensions/`)
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-extension` 文件夹
5. 配置 `config.json` 文件

### 用户注册

1. 点击插件图标
2. 点击"没有账号？注册"
3. 填写用户名、邮箱、密码
4. 点击"注册"按钮
5. 注册成功后自动分配 100MB 存储空间

### 用户登录

1. 点击插件图标
2. 输入邮箱和密码
3. 点击"登录"按钮
4. 登录成功后进入主界面

### 上传图片

**方法1: 通过插件界面上传**
1. 点击"上传图片"按钮
2. 选择一张或多张图片
3. 等待上传完成

**方法2: 通过右键菜单上传**
1. 浏览任意网页
2. 右键点击图片
3. 选择"上传到我的图库"
4. 等待上传完成通知

### 查看和管理图片

1. 登录后在主界面查看图片列表
2. 显示图片缩略图、文件名、上传时间
3. 点击"删除"按钮可删除图片
4. 删除后自动释放存储空间
5. 点击"刷新"按钮更新列表

## 七、API 使用示例

### 获取用户图片列表

```javascript
const { data, error } = await supabaseClient
  .from('user_images')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(20);
```

### 删除图片

```javascript
// 1. 删除存储文件
await supabaseClient
  .storage
  .from('user-images')
  .remove([image.file_path]);

// 2. 删除数据库记录（触发器自动更新配额）
await supabaseClient
  .from('user_images')
  .delete()
  .eq('id', image.id);
```

### 查询用户配额

```javascript
const { data: profile } = await supabaseClient
  .from('user_profiles')
  .select('storage_quota_mb, storage_used_mb')
  .eq('id', user.id)
  .single();

console.log(`已使用: ${profile.storage_used_mb.toFixed(2)} MB`);
console.log(`总配额: ${profile.storage_quota_mb} MB`);
```

## 八、测试清单

### 数据隔离测试

- [ ] 创建两个用户账号
- [ ] 用户A上传图片
- [ ] 用户B登录
- [ ] 验证用户B看不到用户A的图片
- [ ] 验证用户B无法删除用户A的图片

### 存储配额测试

- [ ] 上传图片直到接近配额
- [ ] 验证超出配额时上传失败
- [ ] 删除图片后验证配额释放
- [ ] 验证配额显示准确

### 权限测试

- [ ] 未登录时尝试上传
- [ ] 验证RLS策略生效
- [ ] 尝试访问其他用户的文件路径
- [ ] 验证Storage策略生效

## 九、常见问题

### Q1: 注册后无法登录？
A: 检查邮箱是否已确认。默认配置下邮箱自动确认，如需修改请检查 Supabase 认证设置。

### Q2: 上传失败提示"存储空间不足"？
A: 默认每个用户100MB配额。管理员可在数据库中修改 `user_profiles.storage_quota_mb`。

### Q3: 看到其他用户的图片？
A: 检查RLS策略是否正确配置。执行迁移文件确保所有策略已应用。

### Q4: 插件无法连接到服务器？
A: 检查 `config.json` 中的 URL 和 Key 是否正确，确保网络连接正常。

### Q5: 删除图片后配额未释放？
A: 检查触发器 `trigger_update_user_storage_usage` 是否正确创建。

## 十、管理员操作

### 调整用户配额

```sql
-- 将用户配额调整为 500MB
UPDATE user_profiles
SET storage_quota_mb = 500
WHERE username = 'target_username';
```

### 查看系统统计

```sql
-- 查看总用户数
SELECT COUNT(*) FROM user_profiles;

-- 查看总图片数
SELECT COUNT(*) FROM user_images;

-- 查看存储使用情况
SELECT
  username,
  storage_used_mb,
  storage_quota_mb,
  (storage_used_mb / storage_quota_mb * 100)::numeric(5,2) as usage_percent
FROM user_profiles
ORDER BY storage_used_mb DESC
LIMIT 10;
```

### 清理未使用的文件

```sql
-- 查找数据库中不存在的存储文件
-- 需要手动在 Supabase Dashboard 中执行清理
```

## 十一、安全建议

1. **密码要求**: 最少6位，建议8位以上包含大小写和数字
2. **Session管理**: JWT默认1小时过期，自动刷新
3. **文件验证**: 限制文件类型和大小
4. **配额监控**: 定期检查用户存储使用情况
5. **备份策略**: 定期备份数据库和存储
6. **日志审计**: 启用Supabase审计日志
7. **HTTPS**: 确保所有连接使用HTTPS
8. **CORS**: 正确配置跨域策略

## 十二、性能优化

1. **缩略图生成**: 建议使用 Supabase Image Transformation
2. **图片压缩**: 上传前在客户端压缩
3. **CDN加速**: 使用Supabase CDN
4. **分页加载**: 图片列表使用分页
5. **索引优化**: 确保所有索引已创建
6. **连接池**: 合理配置数据库连接

## 完成！

现在你拥有了一个功能完整、安全可靠的多用户图片管理系统。
