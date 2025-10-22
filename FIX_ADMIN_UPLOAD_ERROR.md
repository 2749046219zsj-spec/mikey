# 修复管理员上传图片错误

## 错误信息
```
上传失败: new row violates row-level security policy
```

## 问题原因
管理员上传图片到 `public_reference_images` 表时，RLS（行级安全）策略阻止了插入操作。原因是：

1. 现有的RLS策略使用了复杂的子查询来检查用户是否为管理员
2. 这种嵌套的子查询在某些情况下可能无法正确评估
3. 导致即使用户是管理员，策略检查也会失败

## 解决方案

已创建新的迁移文件来修复此问题：
- 文件路径：`supabase/migrations/20251022033000_fix_public_reference_images_rls.sql`

### 修复内容

1. **创建辅助函数 `is_admin()`**
   - 使用 `SECURITY DEFINER` 函数来检查当前用户是否为管理员
   - 这种方式更可靠，避免了嵌套子查询的问题

2. **简化RLS策略**
   - 删除所有旧的策略
   - 使用 `is_admin()` 函数重新创建策略
   - 策略更简洁，更容易维护

### 应用迁移的步骤

#### 方法1：使用Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard
2. 进入项目的 SQL Editor
3. 复制 `supabase/migrations/20251022033000_fix_public_reference_images_rls.sql` 文件的内容
4. 粘贴到SQL Editor中
5. 点击"Run"执行SQL

#### 方法2：使用Supabase CLI

如果你安装了Supabase CLI：

```bash
# 在项目根目录执行
supabase db push
```

或者直接执行迁移文件：

```bash
supabase db execute -f supabase/migrations/20251022033000_fix_public_reference_images_rls.sql
```

#### 方法3：手动执行SQL

如果无法使用以上方法，可以手动执行以下SQL：

```sql
-- 1. 创建辅助函数
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

-- 2. 删除旧策略（public_reference_products）
DROP POLICY IF EXISTS "Anyone can view active public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can view all public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can insert public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can update public products" ON public_reference_products;
DROP POLICY IF EXISTS "Admins can delete public products" ON public_reference_products;

-- 3. 删除旧策略（public_reference_images）
DROP POLICY IF EXISTS "Anyone can view active public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can view all public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can insert public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can update public images" ON public_reference_images;
DROP POLICY IF EXISTS "Admins can delete public images" ON public_reference_images;

-- 4. 创建新策略（public_reference_products）
CREATE POLICY "Anyone can view active products"
  ON public_reference_products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON public_reference_products FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert products"
  ON public_reference_products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
  ON public_reference_products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete products"
  ON public_reference_products FOR DELETE
  TO authenticated
  USING (is_admin());

-- 5. 创建新策略（public_reference_images）
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
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert images"
  ON public_reference_images FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update images"
  ON public_reference_images FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete images"
  ON public_reference_images FOR DELETE
  TO authenticated
  USING (is_admin());
```

## 验证修复

应用迁移后，请验证：

1. **测试管理员上传**
   - 以管理员身份登录
   - 进入"管理员控制台" → "公共参考图"
   - 展开一个产品
   - 选择图片文件上传
   - 应该能够成功上传，并显示"成功上传 X 张图片"

2. **测试普通用户**
   - 以普通用户身份登录
   - 尝试访问公共参考图库
   - 应该能够看到所有已启用的产品和图片
   - 但无法上传或修改

3. **检查RLS策略**
   在Supabase Dashboard的SQL Editor中执行：
   ```sql
   SELECT policyname, cmd, roles
   FROM pg_policies
   WHERE tablename IN ('public_reference_products', 'public_reference_images')
   ORDER BY tablename, cmd;
   ```
   应该看到新的策略已经生效。

## 预期结果

应用此迁移后：
- ✅ 管理员可以成功上传图片到公共参考图库
- ✅ 管理员可以批量上传多张图片
- ✅ 普通用户可以浏览所有公共参考图
- ✅ 普通用户无法修改公共参考图
- ✅ RLS策略简洁高效

## 技术说明

### 为什么使用 SECURITY DEFINER 函数？

`SECURITY DEFINER` 函数以定义者的权限运行，而不是调用者的权限。这对于RLS策略中的权限检查非常重要：

- 普通的子查询在RLS策略中可能会遇到权限问题
- `SECURITY DEFINER` 函数绕过了这些权限限制
- 函数可以安全地查询 `user_profiles` 表来检查管理员状态

### 为什么删除旧策略？

Supabase的RLS策略是累加的（默认为OR逻辑）。如果不删除旧策略：
- 旧策略和新策略会同时生效
- 可能导致意外的权限行为
- 难以调试和维护

因此我们先删除所有旧策略，然后创建新的简化策略。

## 如果问题仍然存在

如果应用迁移后问题仍然存在，请检查：

1. **确认用户确实是管理员**
   ```sql
   SELECT id, email, is_admin
   FROM user_profiles
   WHERE id = auth.uid();
   ```

2. **检查RLS是否启用**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename IN ('public_reference_products', 'public_reference_images');
   ```
   `rowsecurity` 应该为 `true`

3. **测试 is_admin() 函数**
   ```sql
   SELECT is_admin();
   ```
   管理员用户应该返回 `true`

4. **查看详细错误**
   在浏览器控制台查看完整的错误堆栈
   在 Supabase Dashboard 的 Logs 中查看详细日志

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：
- 完整的错误消息
- 用户的 `is_admin` 状态
- RLS策略列表
- Supabase 日志截图
