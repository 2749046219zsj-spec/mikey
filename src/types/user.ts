export interface UserProfile {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  id: string;
  user_id: string;
  draw_limit: number;
  remaining_draws: number;
  chat_assistant_enabled: boolean;
  app_access_level: 'basic' | 'full';
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  action_type: string;
  details: Record<string, any>;
  created_at: string;
}

export interface UserWithPermissions extends UserProfile {
  permissions: UserPermissions;
}
