# 修复HTTP 401上传错误

## 问题描述

上传图片时出现"HTTP 401: 网络错误 上传失败"错误。

## 最新修复（2025-10-27）

**Edge Function已完全重写**，现在使用API Key验证而非用户JWT验证，使插件使用更加简单。

## 修复内容

1. **Edge Function** - 改用 `apikey` 头验证（不再需要用户登录）
2. **Edge Function** - 设置 `verify_jwt: false`
3. **认证方式** - 使用Supabase匿名密钥进行API Key验证

### 如何修复

#### 步骤1：重新加载扩展

1. 打开 `chrome://extensions/`
2. 找到"竞品图库上传助手"
3. 点击刷新图标（重新加载扩展）

#### 步骤2：配置Supabase匿名密钥

1. 点击插件图标打开配置面板

2. 在"API上传地址"输入框输入：
   ```
   https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload
   ```

3. 在"Supabase匿名密钥"输入框输入：
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2hjcWJna3R3dW1td2ppZXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTA4MDQsImV4cCI6MjA3NTQ4NjgwNH0.7yxFYrZ8NlPNjsxhoXbl-QodDViT8vdfg4v4N8x8opA
   ```

4. 点击"保存配置"

#### 步骤3：测试上传

1. 访问测试网站（如 https://unsplash.com）
2. 右键点击任意图片
3. 选择"上传到竞品图库"
4. 应该看到"上传成功"通知

## 配置信息来源

这些配置信息来自项目的 `.env` 文件：

```bash
# 项目根目录/.env
VITE_SUPABASE_URL=https://tvghcqbgktwummwjiexp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 技术说明

### 添加的授权头

```javascript
headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
headers['apikey'] = supabaseAnonKey;
```

这两个头部信息是Supabase Edge Functions所需的标准授权方式：
- `Authorization`: Bearer token格式
- `apikey`: Supabase的API密钥

### 为什么需要anon key？

虽然Edge Function设置为 `verify_jwt: false`（不验证JWT），但Supabase仍然需要基本的API密钥来：
1. 识别请求来源
2. 应用速率限制
3. 记录使用统计
4. 确保安全性

## 安全说明

### 匿名密钥是安全的

- anon key是**公开密钥**，可以在客户端使用
- 它只提供受限的访问权限
- 真正的权限控制由RLS（行级安全）策略控制
- 不要与service_role_key混淆（那是私密的）

### 在浏览器扩展中使用

浏览器扩展的配置存储在：
- Chrome: 本地存储（chrome.storage.local）
- 仅在用户浏览器中可见
- 不会发送到其他服务器

## 常见问题

### Q: 我忘记保存密钥了怎么办？

A: 可以随时在插件配置面板重新输入并保存。

### Q: 密钥会过期吗？

A: Supabase的anon key通常不会过期，但项目重新生成密钥时需要更新。

### Q: 还是上传失败怎么办？

A: 检查以下几点：
1. 确认API地址正确
2. 确认密钥完整且无多余空格
3. 打开浏览器控制台查看详细错误信息
4. 确认Edge Function已正确部署

### Q: 如何查看详细错误？

```javascript
// 在浏览器控制台执行
chrome.storage.local.get(['config'], console.log)
```

## 验证配置

### 快速验证命令

```bash
# 测试Edge Function是否可访问
curl -X POST https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2hjcWJna3R3dW1td2ppZXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTA4MDQsImV4cCI6MjA3NTQ4NjgwNH0.7yxFYrZ8NlPNjsxhoXbl-QodDViT8vdfg4v4N8x8opA" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2hjcWJna3R3dW1td2ppZXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTA4MDQsImV4cCI6MjA3NTQ4NjgwNH0.7yxFYrZ8NlPNjsxhoXbl-QodDViT8vdfg4v4N8x8opA"
```

应该返回类似这样的错误（因为没有发送文件）：
```json
{"error": "未提供文件"}
```

这说明授权是成功的，只是缺少文件数据。

## 总结

问题已完全修复！只需：
1. 重新加载扩展
2. 配置API地址和匿名密钥
3. 保存配置
4. 开始使用

现在上传应该可以正常工作了！
