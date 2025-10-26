# 图标说明

## 需要的图标尺寸

浏览器扩展需要以下三种尺寸的图标：

- **icon16.png** - 16x16 像素（浏览器工具栏）
- **icon48.png** - 48x48 像素（扩展管理页面）
- **icon128.png** - 128x128 像素（Chrome Web Store）

## 如何创建图标

### 方法1: 使用在线工具

推荐使用以下免费工具：

1. **Canva** - https://canva.com
   - 创建128x128图标
   - 使用"图片上传"图标或相机图标
   - 导出为PNG格式
   - 使用图片编辑工具缩放为其他尺寸

2. **Figma** - https://figma.com
   - 专业的设计工具
   - 可以批量导出多个尺寸

3. **IconScout** - https://iconscout.com
   - 搜索 "upload" 或 "gallery" 图标
   - 下载PNG格式

### 方法2: 使用代码生成

创建简单的SVG图标并转换为PNG：

```html
<!-- 简单的上传图标SVG -->
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#4CAF50"/>
  <path d="M64 32 L64 80 M40 56 L64 32 L88 56"
        stroke="white" stroke-width="8"
        stroke-linecap="round" stroke-linejoin="round"
        fill="none"/>
  <rect x="32" y="80" width="64" height="16"
        rx="4" fill="white"/>
</svg>
```

### 方法3: 临时占位图标

在开发阶段，可以使用纯色占位图标：

```javascript
// 使用Canvas生成占位图标
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');

// 背景色
ctx.fillStyle = '#4CAF50';
ctx.fillRect(0, 0, 128, 128);

// 文字
ctx.fillStyle = 'white';
ctx.font = 'bold 48px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('竞品', 64, 64);

// 导出为PNG
canvas.toDataURL('image/png');
```

## 设计建议

### 颜色方案

- **主色**：#4CAF50（绿色，代表上传/保存）
- **辅色**：白色或浅色
- **背景**：避免使用紫色（根据项目要求）

### 图标元素

建议使用以下元素之一：

1. **上传箭头** ⬆️
   - 简单明了
   - 易于识别

2. **相机/图片** 📷
   - 代表图片功能
   - 视觉直观

3. **文件夹+上传** 📁⬆️
   - 表示保存到图库
   - 功能明确

### 设计原则

- **简洁**：在16x16尺寸下仍能清晰识别
- **对比度高**：确保在亮色和暗色主题下都清晰可见
- **统一风格**：三个尺寸保持一致的设计

## 快速生成工具

### 使用Placeholder.com生成临时图标

```bash
# 下载占位图标
curl "https://via.placeholder.com/128x128/4CAF50/ffffff?text=竞品" -o icon128.png
curl "https://via.placeholder.com/48x48/4CAF50/ffffff?text=竞品" -o icon48.png
curl "https://via.placeholder.com/16x16/4CAF50/ffffff?text=+" -o icon16.png
```

## 安装完成后

将生成的图标文件放置在 `browser-extension/icons/` 目录下：

```
browser-extension/
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

重新加载扩展即可看到新图标。

## 注意事项

- PNG格式，透明背景
- 文件大小控制在100KB以内
- 不要使用渐变（在小尺寸下显示不佳）
- 避免细节过多（16x16时会模糊）
