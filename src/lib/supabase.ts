import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProductOption {
  id: string;
  option_text: string;
  created_at: string;
  is_default: boolean;
}

export const productOptionsService = {
  async getAll(): Promise<ProductOption[]> {
    const { data, error } = await supabase
      .from('product_options')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(optionText: string): Promise<ProductOption> {
    const { data, error } = await supabase
      .from('product_options')
      .insert([{ option_text: optionText, is_default: false }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_options')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async update(id: string, optionText: string): Promise<ProductOption> {
    const { data, error } = await supabase
      .from('product_options')
      .update({ option_text: optionText })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
