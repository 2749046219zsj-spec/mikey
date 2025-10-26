/*
  # 添加公共数据库编辑权限
  
  1. 变更
    - 在 user_permissions 表中添加 can_edit_public_database 字段
    - 此字段控制用户是否可以编辑公共参考图库（竞品图库等）
    - 默认值为 false（普通用户无编辑权限）
    - 管理员可以通过用户管理界面开启此权限
  
  2. 说明
    - 此权限独立于管理员角色
    - 允许管理员灵活控制哪些用户可以上传和管理公共参考图片
    - 不影响用户查看公共图库的权限（所有启用用户都可以查看）
*/

-- 添加公共数据库编辑权限字段
ALTER TABLE user_permissions 
  ADD COLUMN IF NOT EXISTS can_edit_public_database boolean DEFAULT false;

-- 为现有记录设置默认值
UPDATE user_permissions 
SET can_edit_public_database = false 
WHERE can_edit_public_database IS NULL;

-- 设置非空约束
ALTER TABLE user_permissions 
  ALTER COLUMN can_edit_public_database SET NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN user_permissions.can_edit_public_database IS '是否允许编辑公共数据库（上传/删除公共参考图片等）';
