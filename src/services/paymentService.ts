import { supabase } from '../lib/supabase';
import type { RechargePackage, PaymentOrder, PaymentTransaction, CreateOrderParams } from '../types/payment';

class PaymentService {
  async getRechargePackages(): Promise<RechargePackage[]> {
    const { data, error } = await supabase
      .from('recharge_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  async getPackageById(id: string): Promise<RechargePackage | null> {
    const { data, error } = await supabase
      .from('recharge_packages')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getUserOrders(userId: string): Promise<PaymentOrder[]> {
    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getOrderById(orderId: string): Promise<PaymentOrder | null> {
    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getUserTransactions(userId: string): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createWechatOrder(params: CreateOrderParams): Promise<any> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/wechat-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        action: 'create_order',
        ...params,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '创建订单失败');
    }

    return response.json();
  }

  async queryOrderStatus(orderId: string): Promise<PaymentOrder> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/wechat-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        action: 'query_order',
        order_id: orderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '查询订单失败');
    }

    return response.json();
  }

  async getAllOrders(): Promise<PaymentOrder[]> {
    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAllPackages(): Promise<RechargePackage[]> {
    const { data, error } = await supabase
      .from('recharge_packages')
      .select('*')
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  async createPackage(packageData: Partial<RechargePackage>): Promise<RechargePackage> {
    const { data, error } = await supabase
      .from('recharge_packages')
      .insert(packageData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePackage(id: string, packageData: Partial<RechargePackage>): Promise<void> {
    const { error } = await supabase
      .from('recharge_packages')
      .update(packageData)
      .eq('id', id);

    if (error) throw error;
  }

  async deletePackage(id: string): Promise<void> {
    const { error } = await supabase
      .from('recharge_packages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getWechatConfig(): Promise<any> {
    const { data, error } = await supabase
      .from('wechat_payment_config')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateWechatConfig(config: any): Promise<void> {
    const { error } = await supabase
      .from('wechat_payment_config')
      .upsert(config);

    if (error) throw error;
  }
}

export const paymentService = new PaymentService();
