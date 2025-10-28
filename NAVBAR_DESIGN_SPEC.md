# 统一导航栏设计规范

基于参考图片创建的统一导航栏设计系统

## 设计概览

本设计规范基于提供的参考图片，创建了一个现代、简洁且专业的导航栏系统。设计强调一致性、可读性和用户体验。

---

## 一、主导航栏（顶部导航）

### 1.1 整体布局

```
高度: 64px
背景色: #FFFFFF
边框: 1px solid #E5E7EB (底部)
阴影: 0 1px 3px rgba(0, 0, 0, 0.05)
位置: sticky top-0
层级: z-index: 50
```

### 1.2 Logo区域（左侧）

**Logo图标**
- 尺寸: 32px × 32px
- 背景: 渐变 `linear-gradient(135deg, #FF6B35 0%, #FF8C5A 50%, #FF9B7A 100%)`
- 圆角: 8px
- 内容: 图标居中显示

**Logo文字**
- 字体大小: 20px
- 字体粗细: 600 (Semi-bold)
- 颜色: 渐变文字
  - 渐变: `linear-gradient(90deg, #FF6B35 0%, #FF8C5A 100%)`
  - 使用 `background-clip: text` 实现渐变文字效果
- 文本: "画镜AI"
- 间距: 与图标间距 12px

### 1.3 导航链接（中间）

**布局**
- 排列: 水平排列，居中对齐
- 间距: 4px between items

**默认状态**
```css
padding: 8px 16px
border-radius: 8px
font-size: 14px
font-weight: 500
color: #6B7280 (灰色)
transition: all 0.2s ease
```

**悬停状态**
```css
color: #111827 (深灰)
background: #F9FAFB (浅灰背景)
```

**激活状态**
```css
color: #FF6B35 (橙色)
background: #FFF4ED (浅橙背景)
```

**导航项列表**
1. 首页
2. 提示词库
3. 生成图片
4. 批量生成
5. 漫画生成
6. 我的作品
7. 关于

### 1.4 操作区域（右侧）

**主要按钮**
```css
padding: 8px 20px
background: linear-gradient(90deg, #FF6B35 0%, #FF8C5A 100%)
color: #FFFFFF
border-radius: 8px
font-size: 14px
font-weight: 500
box-shadow: 0 1px 3px rgba(255, 107, 53, 0.2)
```

悬停效果：
```css
background: linear-gradient(90deg, #E55A2B 0%, #FF6B35 100%)
box-shadow: 0 2px 6px rgba(255, 107, 53, 0.3)
```

**次要按钮（红色）**
```css
background: linear-gradient(90deg, #EF4444 0%, #DC2626 100%)
其他属性同主要按钮
```

**用户信息显示**
- 字体大小: 14px
- 颜色: #6B7280
- 左侧边框: 1px solid #E5E7EB
- 左侧内边距: 12px

---

## 二、模式切换标签（参考图2样式）

### 2.1 容器样式

```css
display: inline-flex
align-items: center
gap: 8px
background: #1F2937 (深色背景)
border-radius: 8px
padding: 6px
```

### 2.2 标签按钮

**默认状态**
```css
display: flex
align-items: center
gap: 8px
padding: 8px 24px
border-radius: 8px
font-size: 14px
font-weight: 500
color: #9CA3AF (浅灰色)
background: transparent
transition: all 0.2s ease
```

**悬停状态**
```css
color: #FFFFFF
```

**激活状态**
```css
background: #FF6B35 (橙色)
color: #FFFFFF
box-shadow: 0 2px 8px rgba(255, 107, 53, 0.25)
```

---

## 三、颜色系统

### 3.1 主色调

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 主橙色 | #FF6B35 | Logo、激活状态、主按钮 |
| 浅橙色 | #FF8C5A | 渐变辅助色 |
| 珊瑚橙 | #FF9B7A | 渐变结束色 |

### 3.2 中性色

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 纯白 | #FFFFFF | 背景色 |
| 浅灰背景 | #F9FAFB | 悬停背景 |
| 边框灰 | #E5E7EB | 边框、分隔线 |
| 文字灰 | #6B7280 | 默认文字 |
| 深灰文字 | #111827 | 悬停文字 |
| 深色背景 | #1F2937 | 标签容器背景 |
| 标签灰 | #9CA3AF | 未激活标签 |

### 3.3 辅助色

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 浅橙背景 | #FFF4ED | 激活状态背景 |
| 红色主 | #EF4444 | 次要按钮 |
| 红色深 | #DC2626 | 次要按钮渐变 |

---

## 四、字体系统

### 4.1 字体族
- 主字体: Inter, system-ui, -apple-system, sans-serif
- 标题字体: Playfair Display, serif (用于装饰性标题)

### 4.2 字体大小

| 用途 | 大小 | 粗细 |
|-----|------|------|
| Logo文字 | 20px | 600 |
| 导航链接 | 14px | 500 |
| 按钮文字 | 14px | 500 |
| 用户信息 | 14px | 400 |

### 4.3 行高
- 正文行高: 1.6
- 标题行高: 1.2

---

## 五、间距系统

基于 8px 网格系统：

| 间距名称 | 数值 | 用途 |
|---------|------|------|
| xs | 4px | 导航项之间 |
| sm | 8px | 标签内间距、图标间距 |
| md | 12px | Logo元素间距 |
| lg | 16px | 导航项内边距 |
| xl | 20px | 按钮内边距 |
| 2xl | 24px | 容器内边距 |

---

## 六、阴影系统

```css
/* 导航栏阴影 */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

/* 按钮默认阴影 */
box-shadow: 0 1px 3px rgba(255, 107, 53, 0.2);

/* 按钮悬停阴影 */
box-shadow: 0 2px 6px rgba(255, 107, 53, 0.3);

/* 激活标签阴影 */
box-shadow: 0 2px 8px rgba(255, 107, 53, 0.25);
```

---

## 七、动画与过渡

### 7.1 过渡时长
- 快速交互: 0.2s (链接悬停、按钮点击)
- 标准交互: 0.3s (模态框、下拉菜单)

### 7.2 缓动函数
- 标准: `ease` (大多数交互)
- 平滑: `cubic-bezier(0.4, 0, 0.2, 1)` (复杂动画)

---

## 八、响应式设计

### 8.1 断点

```css
/* 移动设备 */
@media (max-width: 640px)

/* 平板设备 */
@media (min-width: 641px) and (max-width: 1024px)

/* 桌面设备 */
@media (min-width: 1025px)
```

### 8.2 适配策略

**移动端（< 640px）**
- 隐藏部分导航项，使用汉堡菜单
- Logo文字缩小或隐藏
- 按钮文字缩短或只显示图标

**平板端（641px - 1024px）**
- 保留主要导航项
- 次要导航项收入"更多"菜单
- 按钮保持完整

**桌面端（> 1024px）**
- 显示所有导航项
- 完整的用户信息和操作区

---

## 九、可访问性

### 9.1 颜色对比度
- 正文文字: 最小对比度 4.5:1 ✓
- 大号文字: 最小对比度 3:1 ✓
- 激活状态: 足够的视觉区分度

### 9.2 键盘导航
- 所有交互元素支持 Tab 键导航
- 清晰的焦点指示器
- 支持回车和空格键激活

### 9.3 屏幕阅读器
- 正确的语义化标签（nav, button, a）
- 必要的 aria-label 属性
- 激活状态的 aria-current 属性

---

## 十、实现示例

### 10.1 React组件示例

```tsx
// 主导航栏
<nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg">
          <ImageIcon size={18} className="text-white" />
        </div>
        <span className="text-xl font-semibold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
          画镜AI
        </span>
      </div>

      {/* 导航链接 */}
      <div className="flex items-center gap-1">
        <button className="navbar-link active">首页</button>
        <button className="navbar-link">提示词库</button>
        {/* ... 更多链接 */}
      </div>

      {/* 操作区 */}
      <div className="flex items-center gap-3">
        <button className="btn-navbar-primary">开始创作</button>
      </div>
    </div>
  </div>
</nav>
```

### 10.2 CSS类使用

```css
/* 使用预定义的CSS类 */
.navbar-unified     /* 主导航栏容器 */
.navbar-logo        /* Logo容器 */
.navbar-logo-icon   /* Logo图标 */
.navbar-logo-text   /* Logo文字 */
.navbar-link        /* 导航链接 */
.navbar-link.active /* 激活的导航链接 */
.mode-tabs          /* 模式切换容器 */
.mode-tab           /* 模式标签 */
.mode-tab.active    /* 激活的模式标签 */
.btn-navbar-primary /* 主按钮 */
.btn-navbar-secondary /* 次按钮 */
```

---

## 十一、最佳实践

### 11.1 保持一致性
- 在整个应用中使用相同的导航栏样式
- 统一的颜色、字体和间距
- 一致的交互行为

### 11.2 性能优化
- 使用 CSS transform 而非 position 进行动画
- 避免大量的 box-shadow 和 blur 效果
- 优化图片和图标资源

### 11.3 维护性
- 使用CSS变量存储颜色和尺寸
- 创建可复用的组件
- 详细的代码注释

---

## 十二、文件位置

相关文件：
- 主导航栏组件: `/src/components/UnifiedNavbar.tsx`
- 聊天头部组件: `/src/components/ChatHeader.tsx`
- 应用内容组件: `/src/AppContent.tsx`
- CSS样式: `/src/index.css` (第498-638行)

---

## 更新日志

**2025-10-28**
- 初始版本，基于参考图片创建统一导航栏设计
- 实现主导航栏和模式切换标签
- 添加完整的设计规范文档
