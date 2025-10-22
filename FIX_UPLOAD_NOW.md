# 🚨 紧急修复：管理员上传图片失败

## 问题
错误信息：`new row violates row-level security policy`

## ⚡ 立即修复（2分钟）

### 步骤1：打开 Supabase Dashboard
访问：https://tvghcqbgktwummwjiexp.supabase.co

### 步骤2：点击 SQL Editor
左侧菜单 → SQL Editor → New query

### 步骤3：复制粘贴并运行

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

-- 删除所有旧策略
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE tablename IN ('public_reference_products', 'public_reference_images')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
  END LOOP;
END $$;

-- 创建 public_reference_products 策略
CREATE POLICY "Anyone can view active products"
  ON public_reference_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON public_reference_products FOR SELECT
  TO authenticated USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON public_reference_products FOR INSERT
  TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON public_reference_products FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON public_reference_products FOR DELETE
  TO authenticated USING (is_admin());

-- 创建 public_reference_images 策略
CREATE POLICY "Anyone can view active images"
  ON public_reference_images FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public_reference_products
      WHERE public_reference_products.id = public_reference_images.product_id
      AND public_reference_products.is_active = true
    )
  );

CREATE POLICY "Admins can view all images"
  ON public_reference_images FOR SELECT
  TO authenticated USING (is_admin());

CREATE POLICY "Admins can insert images"
  ON public_reference_images FOR INSERT
  TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update images"
  ON public_reference_images FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete images"
  ON public_reference_images FOR DELETE
  TO authenticated USING (is_admin());
```

### 步骤4：点击 Run 按钮
等待几秒钟，看到 "Success" 提示

### 步骤5：测试
1. 刷新管理员页面（F5）
2. 尝试上传图片
3. 应该能成功上传

## ✅ 完成！

现在管理员应该可以正常上传图片了。

---

**如果还有问题，请提供：**
1. SQL 执行后的错误消息
2. 您的登录 email
3. 浏览器控制台的完整错误信息
