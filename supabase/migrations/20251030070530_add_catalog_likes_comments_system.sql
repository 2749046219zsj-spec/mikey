/*
  # Add Likes and Comments System for Product Catalog

  1. New Tables
    - `catalog_product_likes`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to catalog_products)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - Unique constraint on (product_id, user_id)
    
    - `catalog_product_comments`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to catalog_products)
      - `user_id` (uuid, foreign key to auth.users)
      - `comment_text` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Table Updates
    - Add `likes_count` to catalog_products
    - Add `comments_count` to catalog_products

  3. Security
    - Enable RLS on all tables
    - Anyone can view likes and comments
    - Authenticated users can like and comment
    - Users can manage their own likes and comments

  4. Functions & Triggers
    - Trigger to update likes_count on catalog_products
    - Trigger to update comments_count on catalog_products
*/

-- Add likes_count and comments_count to catalog_products if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_products' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE catalog_products ADD COLUMN likes_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'catalog_products' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE catalog_products ADD COLUMN comments_count integer DEFAULT 0;
  END IF;
END $$;

-- Create catalog_product_likes table
CREATE TABLE IF NOT EXISTS catalog_product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES catalog_products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- Create catalog_product_comments table
CREATE TABLE IF NOT EXISTS catalog_product_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES catalog_products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_catalog_product_likes_product ON catalog_product_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_likes_user ON catalog_product_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_comments_product ON catalog_product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_comments_created ON catalog_product_comments(created_at DESC);

-- Enable RLS
ALTER TABLE catalog_product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_product_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catalog_product_likes
CREATE POLICY "Anyone can view likes"
  ON catalog_product_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add likes"
  ON catalog_product_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON catalog_product_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for catalog_product_comments
CREATE POLICY "Anyone can view comments"
  ON catalog_product_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON catalog_product_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON catalog_product_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON catalog_product_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update catalog likes_count
CREATE OR REPLACE FUNCTION update_catalog_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE catalog_products
    SET likes_count = likes_count + 1
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE catalog_products
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for catalog likes_count
DROP TRIGGER IF EXISTS update_catalog_product_likes_count_trigger ON catalog_product_likes;
CREATE TRIGGER update_catalog_product_likes_count_trigger
AFTER INSERT OR DELETE ON catalog_product_likes
FOR EACH ROW
EXECUTE FUNCTION update_catalog_product_likes_count();

-- Function to update catalog comments_count
CREATE OR REPLACE FUNCTION update_catalog_product_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE catalog_products
    SET comments_count = comments_count + 1
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE catalog_products
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for catalog comments_count
DROP TRIGGER IF EXISTS update_catalog_product_comments_count_trigger ON catalog_product_comments;
CREATE TRIGGER update_catalog_product_comments_count_trigger
AFTER INSERT OR DELETE ON catalog_product_comments
FOR EACH ROW
EXECUTE FUNCTION update_catalog_product_comments_count();

-- Trigger for updated_at on catalog_product_comments
CREATE OR REPLACE FUNCTION update_catalog_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_catalog_product_comments_updated_at ON catalog_product_comments;
CREATE TRIGGER update_catalog_product_comments_updated_at
BEFORE UPDATE ON catalog_product_comments
FOR EACH ROW
EXECUTE FUNCTION update_catalog_comments_updated_at();

-- Add permission column to user_permissions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_permissions' AND column_name = 'can_manage_product_catalog'
  ) THEN
    ALTER TABLE user_permissions ADD COLUMN can_manage_product_catalog boolean DEFAULT false;
  END IF;
END $$;

-- Update existing categories to match your requirements
UPDATE product_categories SET 
  display_name = '底充香水瓶',
  name = 'bottom-fill-perfume-bottle',
  sort_order = 1
WHERE name = 'bottom-fill-perfume-bottle'
  AND NOT EXISTS (SELECT 1 FROM product_categories WHERE display_name = '底充香水瓶');

INSERT INTO product_categories (name, display_name, sort_order) VALUES
  ('bottom-fill', '底充香水瓶', 1),
  ('square', '方形香水瓶', 2),
  ('leather', '皮革香水瓶', 3),
  ('flat-top', '平头香水瓶', 4),
  ('round', '圆形香水瓶', 5),
  ('special-shape', '异形香水瓶', 6),
  ('accessories', '饰品配件', 7),
  ('fridge-magnets', '冰箱贴', 8)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  sort_order = EXCLUDED.sort_order;