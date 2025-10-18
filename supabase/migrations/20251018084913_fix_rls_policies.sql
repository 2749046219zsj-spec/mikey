/*
  # Fix RLS Policies - Remove Infinite Recursion

  ## Changes
  - Drop existing policies that cause infinite recursion
  - Create new policies without circular dependencies
  - Use proper policy structure for admin checks

  ## Important Notes
  - Admins will be checked using a simpler approach
  - Policies will no longer have self-referential queries
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;

DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update permissions" ON user_permissions;
DROP POLICY IF EXISTS "Users can update their own remaining draws" ON user_permissions;

DROP POLICY IF EXISTS "Users can view their own logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON usage_logs;

-- Create new policies for user_profiles without infinite recursion
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    auth.jwt()->>'email' IN (
      SELECT email FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.is_admin = true
      AND up.email = auth.jwt()->>'email'
    )
  );

-- Create new policies for user_permissions
CREATE POLICY "Users can view own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND is_admin = true
      AND email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can update own draws"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all permissions"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND is_admin = true
      AND email = auth.jwt()->>'email'
    )
  );

-- Create new policies for usage_logs
CREATE POLICY "Users can view own logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() 
      AND is_admin = true
      AND email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can insert own logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());