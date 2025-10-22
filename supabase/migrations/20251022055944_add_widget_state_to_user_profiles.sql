/*
  # Add Widget State to User Profiles

  1. Changes
    - Add `widget_is_open` column to `user_profiles` table to persist chat widget state
    - Default value is `false` (widget closed by default)
  
  2. Security
    - Users can read and update their own widget state
*/

-- Add widget state column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'widget_is_open'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN widget_is_open boolean DEFAULT false;
  END IF;
END $$;
