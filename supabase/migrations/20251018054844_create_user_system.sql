/*
  # User System Setup

  ## Overview
  Creates a comprehensive user management system with membership tiers, credits, and transaction tracking.

  ## 1. New Tables
  
  ### `user_profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, user's email)
  - `username` (text, display name)
  - `membership_tier` (text, membership level: free/basic/advanced/premium)
  - `credits_balance` (integer, current credits)
  - `total_spent` (numeric, total money spent)
  - `is_admin` (boolean, admin flag)
  - `created_at` (timestamptz, account creation)
  - `updated_at` (timestamptz, last update)

  ### `packages`
  - `id` (uuid, primary key)
  - `name` (text, package name)
  - `price` (numeric, price in yuan)
  - `credits` (integer, credits awarded)
  - `tier` (text, membership tier granted)
  - `is_active` (boolean, package availability)
  - `sort_order` (integer, display order)
  - `created_at` (timestamptz)

  ### `transactions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `package_id` (uuid, references packages)
  - `amount` (numeric, payment amount)
  - `credits_awarded` (integer, credits given)
  - `payment_status` (text, pending/completed/failed)
  - `payment_method` (text, payment type)
  - `transaction_no` (text, unique transaction number)
  - `created_at` (timestamptz)

  ### `credits_history`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `amount` (integer, credit change amount)
  - `type` (text, transaction type: purchase/consumption/bonus/admin_adjust)
  - `description` (text, transaction description)
  - `balance_after` (integer, balance after transaction)
  - `related_transaction_id` (uuid, optional link to transaction)
  - `created_at` (timestamptz)

  ### `daily_checkins`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `checkin_date` (date, date of check-in)
  - `credits_awarded` (integer, credits given)
  - `streak_days` (integer, consecutive days)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Users can read/update their own profile
  - Users can read their own transactions and credits history
  - Admins can access all data
  - Only admins can modify packages
  - System functions handle credit operations

  ## 3. Important Notes
  - All credit operations are tracked in credits_history
  - Transactions record all purchases
  - Daily check-ins are tracked with streak counting
  - Admin panel has full access via is_admin flag
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  username text,
  membership_tier text DEFAULT 'free' CHECK (membership_tier IN ('free', 'basic', 'advanced', 'premium')),
  credits_balance integer DEFAULT 0 CHECK (credits_balance >= 0),
  total_spent numeric(10,2) DEFAULT 0,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  credits integer NOT NULL CHECK (credits >= 0),
  tier text NOT NULL CHECK (tier IN ('basic', 'advanced', 'premium')),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  package_id uuid REFERENCES packages(id),
  amount numeric(10,2) NOT NULL,
  credits_awarded integer NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text DEFAULT 'alipay',
  transaction_no text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create credits_history table
CREATE TABLE IF NOT EXISTS credits_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'consumption', 'bonus', 'admin_adjust', 'checkin', 'refund')),
  description text NOT NULL,
  balance_after integer NOT NULL,
  related_transaction_id uuid REFERENCES transactions(id),
  created_at timestamptz DEFAULT now()
);

-- Create daily_checkins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  credits_awarded integer DEFAULT 10,
  streak_days integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_history_user_id ON credits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_history_created_at ON credits_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(checkin_date DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for packages
CREATE POLICY "Anyone can view active packages"
  ON packages FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for credits_history
CREATE POLICY "Users can view own credits history"
  ON credits_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all credits history"
  ON credits_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for daily_checkins
CREATE POLICY "Users can view own checkins"
  ON daily_checkins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own checkins"
  ON daily_checkins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all checkins"
  ON daily_checkins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert default packages
INSERT INTO packages (name, price, credits, tier, sort_order) VALUES
  ('入门套餐', 39.00, 400, 'basic', 1),
  ('进阶套餐', 79.00, 900, 'advanced', 2),
  ('高级套餐', 99.00, 1200, 'premium', 3)
ON CONFLICT DO NOTHING;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();