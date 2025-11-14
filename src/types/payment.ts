export interface RechargePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  draw_count: number;
  bonus_draws: number;
  validity_days: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentOrder {
  id: string;
  order_no: string;
  user_id: string;
  package_id: string | null;
  payment_method: 'wechat' | 'alipay';
  amount: number;
  draw_count: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  user_id: string;
  type: 'recharge' | 'refund' | 'consume' | 'bonus';
  amount: number;
  draw_change: number;
  before_draws: number;
  after_draws: number;
  description: string;
  created_at: string;
}

export interface WechatPaymentConfig {
  id: string;
  app_id: string;
  mch_id: string;
  api_key: string;
  notify_url: string;
  is_active: boolean;
  updated_at: string;
}

export interface CreateOrderParams {
  package_id: string;
  payment_method: 'wechat' | 'alipay';
}

export interface WechatPayResponse {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
  orderId: string;
}
