# 快速修复 - "Missing authorization header" 错误

## 🔧 立即修复（3分钟）

### 1️⃣ 重新加载扩展

```
chrome://extensions/ → 找到插件 → 点击刷新图标🔄
```

### 2️⃣ 配置两个必填项

点击插件图标，输入以下配置：

**API上传地址**：
```
https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload
```

**Supabase匿名密钥**：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2hjcWJna3R3dW1td2ppZXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTA4MDQsImV4cCI6MjA3NTQ4NjgwNH0.7yxFYrZ8NlPNjsxhoXbl-QodDViT8vdfg4v4N8x8opA
```

### 3️⃣ 保存并测试

点击"保存配置" → 测试上传

---

## ✅ 完成！

现在上传应该正常工作了。

查看 `FIX_AUTH_ISSUE.md` 了解详细技术说明。
