# 快速参考卡片

## 一分钟速查

### 安装命令

```bash
# 1. 生成图标（必需）
cd browser-extension/icons
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=图库" -o icon128.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=图库" -o icon48.png
curl "https://via.placeholder.com/16x16/4CAF50/ffffff" -o icon16.png

# 2. 打开Chrome扩展页面
chrome://extensions/

# 3. 启用开发者模式 → 加载已解压的扩展程序 → 选择 browser-extension 文件夹
```

### API配置

**Supabase URL**:
```
https://tvghcqbgktwummwjiexp.supabase.co
```

**完整API地址**:
```
https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload
```

### 使用方法

```
1. 右键点击网页图片
2. 选择"上传到竞品图库"
3. 等待通知
4. 在主应用查看
```

## 文件清单

| 文件 | 说明 | 大小 |
|-----|------|------|
| manifest.json | 插件配置 | 731B |
| background.js | 后台脚本 | 5.6KB |
| content.js | 内容脚本 | 4.7KB |
| popup.html | 界面HTML | 2.5KB |
| popup.js | 界面逻辑 | 5.6KB |
| popup.css | 界面样式 | 4.4KB |

## 关键端点

| 功能 | URL |
|-----|-----|
| Edge Function | `/functions/v1/competitor-image-upload` |
| Storage Bucket | `reference-images` |
| 数据表 | `public_reference_images` |

## 常用调试

```javascript
// Chrome控制台

// 查看配置
chrome.storage.local.get(['config'], console.log)

// 查看统计
chrome.storage.local.get(['statistics'], console.log)

// 测试API
fetch('https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload', {
  method: 'OPTIONS'
}).then(r => console.log(r.status))
```

## 权限说明

- `contextMenus` - 右键菜单
- `storage` - 本地存储
- `notifications` - 系统通知
- `<all_urls>` - 访问网页图片

## 支持的图片格式

✅ JPG/JPEG
✅ PNG
✅ GIF
✅ WebP
✅ BMP
✅ SVG

## 测试网站

- 🔗 https://unsplash.com (免费图片)
- 🔗 https://pexels.com (免费图片)
- 🔗 https://shein.com (电商测试)

## 状态检查

```bash
# 检查Edge Function
ls supabase/functions/competitor-image-upload/

# 检查插件文件
ls browser-extension/

# 检查图标
ls browser-extension/icons/*.png
```

## 快速重置

```javascript
// 清除所有配置
chrome.storage.local.clear()

// 重新加载扩展
chrome://extensions/ → 点击刷新图标
```

## 文档导航

| 文档 | 用途 |
|-----|------|
| README.md | 完整说明 |
| QUICK_START.md | 快速开始 |
| INSTALLATION_GUIDE.md | 安装指南 |
| QUICK_REFERENCE.md | 本文档 |

## 技术栈

**前端**: Manifest V3, JavaScript
**后端**: Supabase Edge Functions, Deno
**存储**: Supabase Storage, PostgreSQL
**通信**: REST API, FormData

## 限制

- 单文件: < 50MB
- 并发: 避免批量上传
- CORS: 某些网站有限制
- 登录: 某些图片需要认证

---

保存此卡片以便快速查阅！
