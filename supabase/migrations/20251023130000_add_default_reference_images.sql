/*
  # 添加用户默认参考图设置

  1. 功能说明
    - 用户可以保存常用的参考图设置
    - 系统记住用户上次选择的参考图
    - 下次打开时自动加载

  2. 新增字段
    - `user_profiles` 表添加：
      - `default_reference_images` - 存储用户默认参考图配置 (JSONB)
        格式: {
          "images": ["url1", "url2", ...],
          "lastUsedAt": "2025-01-01T00:00:00Z"
        }

  3. 安全策略
    - 用户只能修改自己的默认参考图设置
*/

-- 添加默认参考图配置字段到 user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'default_reference_images'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN default_reference_images jsonb DEFAULT '{"images": [], "lastUsedAt": null}'::jsonb;
  END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_ref_images ON user_profiles USING gin(default_reference_images);

-- 注释
COMMENT ON COLUMN user_profiles.default_reference_images IS '用户默认参考图配置，包含图片URL列表和最后使用时间';
