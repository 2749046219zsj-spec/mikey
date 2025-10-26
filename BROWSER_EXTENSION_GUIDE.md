# 浏览器扩展插件 - 竞品图库上传助手

## 项目概述

已成功开发完成一个浏览器扩展插件，用于快速将网页图片上传到竞品图库系统。

### 核心功能

- 右键菜单快速上传图片到竞品图库
- 自动提取图片元数据和商品信息
- 智能识别主流电商网站（SHEIN、淘宝、亚马逊等）
- 实时上传进度和结果通知
- 完整的配置和统计功能
- 与Supabase数据库无缝集成

## 文件位置

所有扩展文件位于：`/browser-extension/` 目录

### 目录结构

```
browser-extension/
├── manifest.json              # Manifest V3配置文件
├── background.js              # 后台脚本（处理上传）
├── content.js                 # 内容脚本（提取信息）
├── popup.html                 # 弹窗界面
├── popup.js                   # 弹窗逻辑
├── popup.css                  # 弹窗样式
├── config.example.json        # 配置示例
├── README.md                  # 完整使用文档
├── QUICK_START.md            # 5分钟快速开始
├── INSTALLATION_GUIDE.md     # 详细安装指南
└── icons/                    # 图标文件夹
    ├── ICON_README.md        # 图标创建指南
    └── (需要添加3个PNG图标)
```

## 已部署的后端服务

### Edge Function

**名称**：`competitor-image-upload`

**URL**：
```
https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload
```

**功能**：
- 接收浏览器扩展上传的图片
- 保存到Supabase Storage (`reference-images` bucket)
- 在数据库中创建记录（`public_reference_images` 表）
- 支持CORS跨域访问
- 无需JWT验证（公共访问）

## 快速开始（3步）

### 1. 创建图标文件

```bash
cd browser-extension/icons

# 快速生成临时占位图标
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=图库" -o icon128.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=图库" -o icon48.png
curl "https://via.placeholder.com/16x16/4CAF50/ffffff" -o icon16.png
```

### 2. 安装到Chrome

1. 打开 `chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `browser-extension` 文件夹

### 3. 配置API地址

1. 点击插件图标
2. 输入API地址：
   ```
   https://tvghcqbgktwummwjiexp.supabase.co/functions/v1/competitor-image-upload
   ```
3. 点击"测试连接"
4. 点击"保存配置"

## 使用方法

1. 访问任意网页（如 https://shein.com）
2. 右键点击图片
3. 选择"上传到竞品图库"
4. 等待上传完成通知
5. 在主应用的"参考图库"中查看

## 技术特性

### 前端技术

- **Manifest V3**：最新的浏览器扩展标准
- **Context Menus API**：右键菜单集成
- **Storage API**：本地配置存储
- **Notifications API**：系统通知
- **Fetch API**：图片下载和上传

### 后端技术

- **Supabase Edge Functions**：Deno运行时
- **Supabase Storage**：图片存储
- **PostgreSQL**：元数据存储
- **CORS支持**：跨域访问

### 安全特性

- XSS防护：严格的内容安全策略
- 数据隔离：用户配置仅保存本地
- HTTPS传输：所有通信加密
- 输入验证：URL和文件格式验证

## 支持的网站

### 完整支持（含商品信息提取）

- SHEIN (shein.com)
- 淘宝 (taobao.com)
- 天猫 (tmall.com)
- 亚马逊 (amazon.com)

### 基础支持（仅上传图片）

- 所有包含图片的网页

## 提取的数据

### 图片信息

- 图片URL
- 图片尺寸（宽度、高度）
- Alt文本
- Title属性

### 页面信息

- 页面URL
- 页面标题

### 商品信息（如果可识别）

- 商品名称
- 商品价格
- 商品描述

### 元数据

- 上传时间
- 文件大小
- MIME类型
- 上传方式（browser-extension）

## 与主应用集成

上传的图片会自动出现在主应用的以下位置：

**路径**：参考图库 → 公共数据库标签

**标签**：
- `竞品`
- `浏览器上传`

**类别**：`competitor`

## 文档导航

- **README.md** - 完整的功能说明和使用文档
- **QUICK_START.md** - 5分钟快速开始指南
- **INSTALLATION_GUIDE.md** - 详细安装配置步骤
- **icons/ICON_README.md** - 图标创建指南
- **config.example.json** - 配置文件示例

## 常见使用场景

### 场景1：收集竞品设计灵感

```
1. 访问竞品网站（如SHEIN）
2. 浏览商品页面
3. 右键上传喜欢的设计
4. 在主应用中分类整理
```

### 场景2：批量保存参考图

```
1. 访问设计素材网站（如Unsplash）
2. 快速右键保存多张图片
3. 系统自动去重和分类
4. 在主应用中查看和管理
```

### 场景3：团队协作收集

```
1. 团队成员各自使用插件收集
2. 所有图片汇总到公共图库
3. 在主应用中讨论和筛选
4. 导出用于设计参考
```

## 性能优化

- 图片自动压缩
- 重复上传检测
- 批量上传队列
- 智能缓存机制

## 限制说明

### Supabase限制

- Storage配额：根据订阅计划
- 文件大小：单个文件最大50MB
- 并发上传：避免同时上传大量图片

### 浏览器限制

- 跨域图片：某些网站有防盗链保护
- 需要登录：某些图片需要先登录网站
- 动态加载：某些图片可能无法识别

## 故障排除

### 上传失败

**检查项**：
1. API地址是否正确
2. Edge Function是否部署
3. 网络连接是否正常
4. 浏览器控制台错误信息

### 无法获取商品信息

**原因**：网站结构特殊

**解决**：图片仍会正常上传，只是缺少额外信息

### 某些图片无法上传

**原因**：防盗链或CORS限制

**解决**：尝试在新标签页打开图片后再上传

## 未来增强计划

- [ ] 批量上传模式
- [ ] 图片预览功能
- [ ] 自定义分类标签
- [ ] 离线队列支持
- [ ] 图片OCR文字识别
- [ ] 相似图片检测

## 注意事项

### 法律合规

- 仅用于内部参考研究
- 不得用于商业侵权
- 尊重原作者版权
- 遵守网站使用条款

### 使用建议

- 定期清理无用图片
- 注意存储空间配额
- 避免上传敏感信息
- 合理使用上传频率

## 技术支持

### 问题反馈

1. 查看浏览器控制台
2. 检查Edge Function日志
3. 查看主应用错误提示

### 开发调试

```javascript
// 查看配置
chrome.storage.local.get(['config'], console.log)

// 查看统计
chrome.storage.local.get(['statistics'], console.log)

// 清除数据
chrome.storage.local.clear()
```

## 总结

浏览器扩展插件已完整开发完成，包括：

✅ 完整的插件代码（Manifest V3）
✅ 后端API服务（Edge Function）
✅ 数据库集成（Supabase）
✅ 详细的文档说明
✅ 快速开始指南
✅ 故障排除方案

**下一步**：
1. 创建图标文件
2. 安装到浏览器
3. 配置API地址
4. 开始使用

查看 `browser-extension/QUICK_START.md` 开始 5 分钟快速配置！
