# AutoCine 环境配置指南

## 问题说明
AutoCine 的 GPT 调用失败，是因为 Supabase Edge Function 的环境变量未配置。

## 解决步骤

### 1. 登录 Supabase Dashboard
访问：https://supabase.com/dashboard

### 2. 配置 Edge Function Secrets

在项目设置中添加以下环境变量：

#### 方式一：通过 Dashboard UI
1. 进入你的项目
2. 点击左侧菜单 **Edge Functions**
3. 点击 **Settings** 或 **Secrets** 标签
4. 添加以下 secrets：

```
GEMINI_API_KEY=dLxfBB6sLW5BDdKw0N3smMiHkIw67JEMLlXVwzYrmrI
SEEDREAM_API_KEY=<你的 Seedream API Key>
```

#### 方式二：通过 Supabase CLI（如果已安装）
```bash
# 设置 GEMINI API Key
supabase secrets set GEMINI_API_KEY=dLxfBB6sLW5BDdKw0N3smMiHkIw67JEMLlXVwzYrmrI

# 设置 SEEDREAM API Key（如果有）
supabase secrets set SEEDREAM_API_KEY=<你的密钥>
```

### 3. 验证配置

配置完成后，Edge Functions 会自动重启。你可以：

1. **测试 API 调用**
   - 刷新浏览器页面
   - 进入 AutoCine 功能
   - 尝试创作功能，查看日志是否显示成功

2. **查看 Edge Function 日志**
   - 在 Supabase Dashboard 中
   - 进入 Edge Functions → gemini-proxy
   - 查看 Logs 标签，确认是否有错误

### 4. 常见问题

#### Q: 配置后仍然失败？
A:
- 确保 API Key 没有多余的空格
- 检查 Edge Function 是否已自动重启（可能需要等待1-2分钟）
- 查看浏览器控制台是否有其他错误

#### Q: 如何获取 SEEDREAM_API_KEY？
A:
- 访问 https://ark.cn-beijing.volces.com
- 注册并创建 API Key
- 将 Key 配置到 Supabase secrets

#### Q: Poe API Key 从哪里获取？
A:
- 访问 https://poe.com
- 进入 Settings → API
- 创建 API Key

## 技术说明

### Edge Functions 列表
当前已部署的 Edge Functions：
- `gemini-proxy` - 用于 GPT/AI 模型调用（AutoCine 使用）
- `seedream-proxy` - 用于图像生成（主应用使用）
- `image-proxy` - 图像代理
- `competitor-image-upload` - 竞品图片上传

### 环境变量作用域
- `.env` 文件中的变量（如 `VITE_GEMINI_API_KEY`）仅在前端可见
- Edge Functions 需要在 Supabase 中单独配置 secrets
- 两者是完全独立的

### 安全性
使用 Edge Functions 代理的优势：
1. API Key 不暴露给前端
2. 所有请求从服务器发起，绕过网络限制
3. 便于监控和日志记录
4. 统一的错误处理

## 测试命令

如果你想本地测试 Edge Function：

```bash
# 启动本地 Supabase
supabase start

# 设置本地 secrets
supabase secrets set --env-file .env.local GEMINI_API_KEY=your_key_here

# 测试 function
curl -X POST 'http://localhost:54321/functions/v1/gemini-proxy' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gpt-5",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## 下一步

配置完成后，AutoCine 功能应该可以正常使用：
1. 进入 AutoCine 模块
2. 输入创作主题
3. 点击"开始生成"
4. 查看日志输出，确认 API 调用成功

如果仍有问题，请查看：
- Supabase Dashboard → Edge Functions → Logs
- 浏览器控制台（F12）→ Network 标签
- AutoCine 面板中的日志输出
