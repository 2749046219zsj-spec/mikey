/*
  # 允许管理员账号自动创建

  ## 修改
  - 添加策略允许特定邮箱（管理员）自动创建 profile
  - 确保管理员账号可以在首次登录时自动注册和设置权限

  ## 安全
  - 仅限特定管理员邮箱
  - 自动设置管理员权限
*/

-- 添加策略允许管理员邮箱自动创建profile
CREATE POLICY "Admin email can auto-create profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    email = '2749046219@qq.com'
  );

-- 允许管理员邮箱自动更新自己的权限
CREATE POLICY "Admin can update own admin status"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id AND email = '2749046219@qq.com'
  )
  WITH CHECK (
    auth.uid() = id AND email = '2749046219@qq.com'
  );
