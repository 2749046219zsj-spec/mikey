/*
  # 自动同步用户名到画廊

  当用户更新用户名时，自动同步更新到公开画廊中的所有相关记录。

  1. 创建触发器函数
    - 监听 user_profiles 表的 username 更新
    - 自动更新 public_gallery 表中该用户的所有记录的 username

  2. 创建触发器
    - 在 user_profiles 表更新后自动执行
*/

-- 创建触发器函数：当用户名更新时同步到画廊
CREATE OR REPLACE FUNCTION sync_username_to_gallery()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在用户名发生变化时执行
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    -- 更新该用户在公开画廊中的所有图片的用户名
    UPDATE public_gallery
    SET username = NEW.username
    WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS sync_username_to_gallery_trigger ON user_profiles;

CREATE TRIGGER sync_username_to_gallery_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_username_to_gallery();