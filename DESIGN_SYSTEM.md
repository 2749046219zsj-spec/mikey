# 轻奢香水瓶风格 - UI/UX设计系统

## 🎨 设计理念

基于爱马仕橙色和香水瓶美学，打造简约奢华、精致优雅的视觉体验。

---

## 📐 配色方案

### 主色调 - 爱马仕橙色系
```css
--hermes-orange: #FF6B35     /* 主橙色 - 按钮、重点元素 */
--hermes-orange-light: #FF8C5A  /* 浅橙 - 悬停效果 */
--hermes-orange-dark: #E55A2B   /* 深橙 - 激活状态 */
--hermes-coral: #FF9B7A         /* 珊瑚橙 - 渐变使用 */
```

**使用场景：**
- 主要行动按钮（CTA）
- 重要标签和徽章
- 交互元素的活跃状态
- 强调性装饰元素

### 辅助色 - 奢华金色系
```css
--luxury-gold: #D4AF37       /* 奢华金 - 高级感装饰 */
--champagne-gold: #F0E5D8    /* 香槟金 - 背景渐变 */
--rose-gold: #B76E79         /* 玫瑰金 - 柔和点缀 */
```

**使用场景：**
- VIP用户标识
- 装饰性分隔线
- 高级功能标记
- 渐变背景

### 中性色 - 精致灰白系
```css
--pure-white: #FFFFFF        /* 纯白 - 卡片背景 */
--cream-white: #FAF8F5       /* 奶白 - 页面背景 */
--warm-beige: #F5E6D3        /* 暖米色 - 次要背景 */
--soft-sand: #E8DCC8         /* 柔沙色 - 边框装饰 */
--elegant-gray: #A39E93      /* 优雅灰 - 次要文字 */
--charcoal: #2C2C2C          /* 炭黑 - 主要文字 */
--deep-black: #1A1A1A        /* 深黑 - 标题文字 */
```

**使用场景：**
- 背景层次构建
- 文字颜色层级
- 边框和分隔线
- 禁用状态

### 强调色
```css
--accent-amber: #FFBF69      /* 琥珀色 - 警告提示 */
--accent-terracotta: #CB7B5C /* 赤陶色 - 次要强调 */
```

---

## 🔤 字体系统

### 字体族

```css
/* 标题 - 优雅衬线体 */
font-family: 'Playfair Display', serif;
/* 用于：h1, h2, h3, h4, h5, h6 */

/* 正文 - 精致无衬线体 */
font-family: 'Inter', sans-serif;
/* 用于：p, span, div, button */

/* 装饰性文字 */
font-family: 'Cormorant Garamond', serif;
/* 用于：特殊标题、引用文字 */
```

### 字号与行高
```css
h1 { font-size: 3.5rem; line-height: 1.2; letter-spacing: -0.02em; }
h2 { font-size: 2.5rem; line-height: 1.2; letter-spacing: -0.02em; }
h3 { font-size: 1.875rem; line-height: 1.3; }
h4 { font-size: 1.5rem; line-height: 1.3; }
body { font-size: 1rem; line-height: 1.6; letter-spacing: 0.01em; }
small { font-size: 0.875rem; line-height: 1.5; }
```

---

## 🎭 阴影系统

```css
--shadow-sm: 0 2px 8px rgba(255, 107, 53, 0.08)
--shadow-md: 0 4px 16px rgba(255, 107, 53, 0.12)
--shadow-lg: 0 8px 32px rgba(255, 107, 53, 0.16)
--shadow-xl: 0 12px 48px rgba(255, 107, 53, 0.20)
--shadow-luxury: 0 20px 60px rgba(212, 175, 55, 0.15)
```

**使用原则：**
- `shadow-sm`: 卡片默认状态
- `shadow-md`: 按钮、输入框
- `shadow-lg`: 卡片悬停状态
- `shadow-xl`: 弹窗、模态框
- `shadow-luxury`: 特殊装饰元素

---

## 🌈 渐变系统

### 日落渐变（主要）
```css
background: linear-gradient(135deg, #FF6B35 0%, #FF9B7A 50%, #FFBF69 100%);
```
**用途：** 按钮、标签、强调性背景

### 金色渐变
```css
background: linear-gradient(135deg, #D4AF37 0%, #F0E5D8 100%);
```
**用途：** 徽章、VIP标识

### 优雅背景渐变
```css
background: linear-gradient(180deg, #FAF8F5 0%, #E8DCC8 100%);
```
**用途：** 页面背景

### 遮罩渐变
```css
background: linear-gradient(180deg, rgba(26, 26, 26, 0) 0%, rgba(26, 26, 26, 0.7) 100%);
```
**用途：** 图片悬停遮罩

---

## 🎬 动画效果

### 1. 优雅浮动
```css
@keyframes float-gentle {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-20px) translateX(10px); }
}
animation: float-gentle 6s ease-in-out infinite;
```
**用途：** 装饰性元素

### 2. 奢华旋转加载
```css
@keyframes luxury-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
animation: luxury-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
```
**用途：** 加载指示器

### 3. 渐入淡出
```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: fade-in-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```
**用途：** 列表项、卡片入场

### 4. 光泽效果
```css
.btn-luxury::before {
  content: '';
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 0.6s;
}
```
**用途：** 按钮悬停

---

## 🧩 核心组件

### 1. 奢华按钮 (.btn-luxury)
```css
background: var(--gradient-sunset);
color: white;
padding: 0.875rem 2rem;
border-radius: 2rem;
box-shadow: var(--shadow-md);
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

**交互状态：**
- Hover: 提升阴影 + 向上移动2px
- Active: 恢复位置
- 光泽动画从左到右

### 2. 优雅卡片 (.card-luxury)
```css
background: white;
border-radius: 1.5rem;
padding: 2rem;
box-shadow: var(--shadow-sm);
```

**悬停效果：**
- 顶部出现橙色渐变线条
- 提升阴影至 shadow-lg
- 向上移动4px

### 3. 画廊图片 (.gallery-item)
```css
position: relative;
border-radius: 1rem;
overflow: hidden;
aspect-ratio: 1;
```

**悬停效果：**
- 图片放大110%
- 显示渐变遮罩
- 底部信息卡片滑入
- 增强阴影 (shadow-luxury)

### 4. 优雅输入框 (.input-luxury)
```css
background: white;
border: 2px solid var(--soft-sand);
border-radius: 1rem;
padding: 1rem 1.5rem;
```

**焦点状态：**
- 边框变为橙色
- 显示橙色光晕 (box-shadow)

### 5. 加载动画 (.loader-luxury)
```css
width: 60px;
height: 60px;
border: 4px solid var(--warm-beige);
border-top-color: var(--hermes-orange);
border-radius: 50%;
```

---

## 🎪 画廊界面设计

### 布局结构
```
┌─────────────────────────────────────┐
│  装饰性渐变背景 (5% opacity)          │
├─────────────────────────────────────┤
│  徽章标签 (AI创意画廊)                │
│  大标题 (Playfair Display 5xl)       │
│  副标题 (优雅灰)                      │
│  金色装饰线                          │
├─────────────────────────────────────┤
│  筛选栏 (半透明背景 + 毛玻璃)         │
├─────────────────────────────────────┤
│  网格画廊 (4列响应式)                │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐          │
│  │   │ │   │ │   │ │   │          │
│  └───┘ └───┘ └───┘ └───┘          │
└─────────────────────────────────────┘
```

### 卡片悬停效果时序
```
0ms   → 鼠标悬停开始
0-400ms → 图片缩放 scale(1 → 1.1)
0-400ms → 遮罩淡入 opacity(0 → 1)
100ms → 用户信息从底部滑入
200ms → 底部信息卡片淡入 + 向上滑动
```

---

## 🎨 使用示例

### HTML/React 组件示例

```tsx
// 奢华按钮
<button className="btn-luxury">
  立即体验
</button>

// 次要按钮
<button className="btn-secondary">
  了解更多
</button>

// 优雅卡片
<div className="card-luxury">
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</div>

// 画廊图片
<div className="gallery-item">
  <img src="..." alt="..." />
</div>

// 奢华徽章
<span className="badge-luxury">VIP</span>

// 装饰性文字
<h2 className="font-serif text-4xl">
  优雅<span className="text-luxury-gradient">奢华</span>
</h2>

// 金色分隔线
<div className="divider-gold" />
```

### Tailwind 类名组合

```tsx
// 优雅容器
className="bg-elegant-cream rounded-2xl p-6 shadow-luxury-md"

// 渐变背景
className="bg-gradient-sunset text-white"

// 毛玻璃效果
className="bg-white/80 backdrop-blur-sm"

// 优雅文字
className="font-serif text-3xl text-elegant-black tracking-tight"

// 奢华阴影
className="shadow-luxury hover:shadow-luxury-xl transition-luxury"
```

---

## 📱 响应式设计

### 断点系统
```
sm: 640px   → 手机横屏
md: 768px   → 平板
lg: 1024px  → 笔记本
xl: 1280px  → 桌面
2xl: 1536px → 大屏
```

### 画廊网格响应式
```css
/* 手机 */ grid-cols-1
/* 平板 */ sm:grid-cols-2
/* 笔记本 */ lg:grid-cols-3
/* 桌面 */ xl:grid-cols-4
```

---

## ✨ 设计原则

### 1. 视觉层次
- 使用Playfair Display衬线体突出标题
- 主要内容使用Inter无衬线体保证可读性
- 通过字号、字重、颜色建立清晰层级

### 2. 留白与呼吸感
- 卡片间距：1.5rem (24px)
- 内容边距：2rem (32px)
- 段落间距：1rem (16px)

### 3. 动效时长
- 快速响应：0.2s - 0.3s (按钮点击)
- 标准过渡：0.4s - 0.5s (卡片悬停)
- 慢速动画：0.6s - 1s (页面切换)

### 4. 交互反馈
- 所有可点击元素提供悬停效果
- 加载状态显示优雅的旋转动画
- 成功/失败操作提供视觉反馈

### 5. 色彩平衡
- 主色（橙色）占比：10-20%
- 中性色（灰白）占比：70-80%
- 强调色（金色）占比：5-10%

---

## 🎯 应用场景

### 画廊页面
- 背景：elegant-cream
- 卡片：纯白 + shadow-sm
- 悬停：shadow-luxury + scale(1.03)

### 按钮
- 主要操作：gradient-sunset + 光泽效果
- 次要操作：白底橙边 + 悬停反色

### 输入框
- 默认：柔和边框（soft-sand）
- 焦点：橙色边框 + 光晕

### 加载状态
- 旋转动画 + 橙色顶部边框
- 居中显示 + 提示文字

---

## 📚 参考资源

**灵感来源：**
- 爱马仕官网配色
- 高端香水品牌视觉设计
- 奢侈品电商平台布局

**字体资源：**
- Google Fonts: Playfair Display, Inter, Cormorant Garamond

**设计工具：**
- Figma（原型设计）
- ColorSpace（配色方案）
- Easings.net（动画曲线）

---

**设计系统版本：** 1.0
**最后更新：** 2025-10-27
**维护者：** AI设计团队
