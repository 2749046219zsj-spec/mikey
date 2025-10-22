# 快速修复指南：管理员上传图片错误

## 🚨 问题
管理员上传图片时提示：`new row violates row-level security policy`

## ✅ 快速解决方案

### 步骤1：打开Supabase Dashboard
访问您的Supabase项目控制台

### 步骤2：进入SQL Editor
在左侧菜单找到并点击"SQL Editor"

### 步骤3：执行修复SQL
复制粘贴以下SQL并点击"Run"：

```sql
-- 创建管理员检查函数
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- 删除旧的RLS策略
DROP POLICY IF EXISTS "Admins can insert public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can insert public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can insert images" ON public_reference_images;

-- 创建新的RLS策略
CREATE POLICY "Admins can insert products"
  ON public_reference_products
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can insert images"
  ON public_reference_images
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
```

### 步骤4：测试
1. 刷新管理员页面
2. 尝试上传图片
3. 应该能成功上传

## 📝 如果还有问题

查看完整修复文档：`FIX_ADMIN_UPLOAD_ERROR.md`

或者执行完整的迁移文件：
- 文件位置：`supabase/migrations/20251022033000_fix_public_reference_images_rls.sql`
- 在SQL Editor中复制粘贴整个文件内容并执行

## ✨ 修复后的功能

- ✅ 管理员可以上传图片
- ✅ 支持批量上传
- ✅ 显示上传成功消息
- ✅ 自动创建存储桶
- ✅ 普通用户仍然只能查看
