export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  membership_tier: 'free' | 'basic' | 'advanced' | 'premium';
  credits_balance: number;
  total_spent: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  credits: number;
  tier: 'basic' | 'advanced' | 'premium';
  is_active: boolean;
  sort_order: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  package_id: string | null;
  amount: number;
  credits_awarded: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_no: string | null;
  created_at: string;
}

export interface CreditsHistory {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'consumption' | 'bonus' | 'admin_adjust' | 'checkin' | 'refund';
  description: string;
  balance_after: number;
  related_transaction_id: string | null;
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  credits_awarded: number;
  streak_days: number;
  created_at: string;
}
