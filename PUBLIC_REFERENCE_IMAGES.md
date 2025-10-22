# 公共参考图选择系统

## 概述

为客服助手创建了一个独立的参考图选择界面，支持从Supabase公共数据库和私有数据库选择参考图片。

## 功能特性

### 用户端功能

1. **独立的参考图选择页面** (`ReferenceImageSelector.tsx`)
   - 顶部导航：页面标题、返回按钮、数据库切换
   - 公共数据库 ↔ 私有数据库 导航栏
   - 支持商品浏览和图片选择

2. **公共数据库模式**
   - 显示所有公共商品列表（带标题和货号）
   - 点击商品展开查看该商品的所有图片
   - 左侧：缩略图列表（垂直排列）
   - 右侧：选中图片的放大显示
   - 点击缩略图切换放大图
   - 确认按钮选择当前图片

3. **私有数据库模式**
   - 显示用户上传的私有参考图
   - 网格布局展示图片
   - 点击图片直接选择

4. **集成到现有界面**
   - 在参考图管理器中添加"从数据库选择"按钮
   - 无缝衔接现有上传功能

### 管理员端功能

1. **公共参考图管理** (`PublicReferenceManagement.tsx`)
   - 添加/编辑/删除产品
   - 为每个产品上传多张图片
   - 设置产品标题、货号、分类、描述、排序
   - 管理产品图片（上传、删除、排序）

2. **管理入口**
   - 管理员控制台新增"公共参考图"标签
   - 完整的CRUD操作界面

## 数据库结构

### 1. public_reference_products（公共参考产品表）
```sql
- id: uuid（主键）
- title: text（产品标题）
- product_code: text（货号，唯一）
- category_id: uuid（分类ID，关联product_categories）
- description: text（描述）
- sort_order: integer（排序）
- is_active: boolean（是否启用）
- created_at: timestamptz
- updated_at: timestamptz
- created_by: uuid
```

### 2. public_reference_images（公共参考图片表）
```sql
- id: uuid（主键）
- product_id: uuid（关联public_reference_products）
- image_url: text（图片URL）
- thumbnail_url: text（缩略图URL，可选）
- file_name: text（文件名）
- display_order: integer（显示顺序）
- is_active: boolean（是否启用）
- created_at: timestamptz
- updated_at: timestamptz
- created_by: uuid
```

## 安全策略（RLS）

### 公共参考产品
- 所有人可查看已启用的产品
- 管理员可查看所有产品
- 管理员可增删改产品

### 公共参考图片
- 所有人可查看已启用产品的已启用图片
- 管理员可查看所有图片
- 管理员可增删改图片

## 文件结构

```
src/
├── components/
│   ├── ReferenceImageSelector.tsx        # 参考图选择主界面
│   ├── ReferenceImageManager.tsx         # 更新：添加数据库选择按钮
│   └── admin/
│       ├── AdminDashboard.tsx            # 更新：添加公共参考图标签
│       └── PublicReferenceManagement.tsx # 管理员管理界面
├── services/
│   └── publicReferenceImageService.ts    # 公共参考图服务
└── supabase/migrations/
    └── create_public_reference_images_system.sql # 数据库迁移
```

## 使用流程

### 管理员端
1. 登录管理员账号
2. 进入管理员控制台
3. 点击"公共参考图"标签
4. 添加产品（输入标题、货号、分类等）
5. 为产品上传图片
6. 设置图片显示顺序

### 用户端
1. 在客服助手中点击"参考图预设"按钮
2. 点击"从数据库选择"按钮
3. 选择"公共数据库"或"私有数据库"
4. 浏览商品列表，点击商品查看图片
5. 点击缩略图预览大图
6. 点击"选择此图片"确认选择
7. 图片自动添加到参考图列表

## 技术特点

1. **响应式设计**
   - 适配手机、平板、桌面
   - 灵活的网格布局

2. **性能优化**
   - 图片懒加载
   - 按需加载产品图片
   - 缩略图支持

3. **用户体验**
   - 清晰的状态反馈
   - 加载动画
   - 错误处理
   - 平滑的过渡动画

4. **安全性**
   - 完整的RLS策略
   - 权限验证
   - 数据隔离（公共/私有）

## 待扩展功能

- 图片搜索和筛选
- 批量上传图片
- 图片标签系统
- 收藏夹功能
- 图片预览大图模式
- 图片排序拖拽功能
