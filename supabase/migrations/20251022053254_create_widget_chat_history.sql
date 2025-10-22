/*
  # Widget Chat History System

  1. New Tables
    - `widget_chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text: 'user' or 'ai')
      - `content` (text)
      - `images` (jsonb array of image URLs)
      - `model` (text)
      - `has_error` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `widget_chat_messages` table
    - Add policy for users to read their own messages
    - Add policy for users to insert their own messages
    - Add policy for users to delete their own messages

  3. Indexes
    - Index on user_id and created_at for efficient querying
*/

CREATE TABLE IF NOT EXISTS widget_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('user', 'ai')),
  content text NOT NULL DEFAULT '',
  images jsonb DEFAULT '[]'::jsonb,
  model text DEFAULT 'Gemini-2.5-Flash-Image',
  has_error boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE widget_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own messages
CREATE POLICY "Users can read own widget messages"
  ON widget_chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own widget messages"
  ON widget_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own widget messages"
  ON widget_chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS widget_chat_messages_user_id_created_at_idx 
  ON widget_chat_messages(user_id, created_at DESC);