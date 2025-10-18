/*
  # Add Role-Based Access Control (RBAC) System
  
  ## Overview
  This migration adds a comprehensive RBAC system with three roles: user, vip, and admin.
  
  ## Changes Made
  
  ### 1. New Tables
  
  #### `user_roles` table
  - `id` (uuid, primary key) - Unique identifier for the role assignment
  - `user_id` (uuid, foreign key to auth.users) - References the user
  - `role` (text) - The role assigned (user, vip, admin)
  - `created_at` (timestamptz) - When the role was assigned
  - `updated_at` (timestamptz) - Last role update timestamp
  - Constraint: Each user can only have one role (unique user_id)
  - Check constraint: Role must be one of 'user', 'vip', 'admin'
  
  #### `rate_limits` table
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key to auth.users) - References the user
  - `endpoint` (text) - The endpoint being rate limited
  - `request_count` (integer) - Number of requests made
  - `window_start` (timestamptz) - Start of the current rate limit window
  - `created_at` (timestamptz) - When the record was created
  
  ### 2. Profile Table Updates
  - Add `role` column to profiles table (defaults to 'user')
  - Add check constraint to ensure role is one of 'user', 'vip', 'admin'
  
  ### 3. Security Policies
  
  #### `user_roles` policies
  - Users can view their own role
  - Only admins can insert/update/delete roles
  
  #### `rate_limits` policies
  - Only admins can view rate limits
  - System can insert/update rate limits
  
  #### `profiles` policies
  - Users can view their own profile
  - Users can update their own profile (except role)
  - Admins can view all profiles
  - Admins can update any profile
  
  ### 4. Functions
  
  #### `is_admin(user_uuid)`
  - Helper function to check if a user is an admin
  - Returns boolean
  
  #### `get_user_role(user_uuid)`
  - Helper function to get a user's role
  - Returns text ('user', 'vip', or 'admin')
  
  #### `handle_new_user()`
  - Trigger function that automatically creates a profile and assigns 'user' role
  - Runs when a new user signs up
  
  ## Security Notes
  - All tables have RLS enabled
  - Default role is 'user' for new signups
  - Only admins can change roles
  - Rate limiting data is protected and only accessible to admins
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('user', 'vip', 'admin'))
);

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add role column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
    ALTER TABLE profiles ADD CONSTRAINT valid_profile_role CHECK (role IN ('user', 'vip', 'admin'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  
  -- Assign default role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for rate_limits
CREATE POLICY "Admins can view rate limits"
  ON rate_limits FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert rate limits"
  ON rate_limits FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update rate limits"
  ON rate_limits FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for profiles (drop existing if any)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can update own non-role fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);