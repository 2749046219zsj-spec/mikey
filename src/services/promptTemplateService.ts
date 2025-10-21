import { supabase } from '../lib/supabase';

export interface PromptTemplate {
  id: string;
  product_category_id: string;
  name: string;
  prompt_content: string;
  prompt_type: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreatePromptTemplateInput {
  product_category_id: string;
  name: string;
  prompt_content: string;
  prompt_type?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdatePromptTemplateInput {
  name?: string;
  prompt_content?: string;
  prompt_type?: string;
  sort_order?: number;
  is_active?: boolean;
}

export const promptTemplateService = {
  async getAllTemplates(includeInactive = false): Promise<PromptTemplate[]> {
    let query = supabase
      .from('prompt_templates')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch prompt templates: ${error.message}`);
    }

    return data || [];
  },

  async getTemplatesByCategory(categoryId: string, includeInactive = false): Promise<PromptTemplate[]> {
    let query = supabase
      .from('prompt_templates')
      .select('*')
      .eq('product_category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch prompt templates: ${error.message}`);
    }

    return data || [];
  },

  async getTemplateById(id: string): Promise<PromptTemplate | null> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch prompt template: ${error.message}`);
    }

    return data;
  },

  async createTemplate(input: CreatePromptTemplateInput): Promise<PromptTemplate> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        ...input,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create prompt template: ${error.message}`);
    }

    return data;
  },

  async updateTemplate(id: string, input: UpdatePromptTemplateInput): Promise<PromptTemplate> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update prompt template: ${error.message}`);
    }

    return data;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete prompt template: ${error.message}`);
    }
  },

  async toggleTemplateStatus(id: string): Promise<PromptTemplate> {
    const template = await this.getTemplateById(id);
    if (!template) {
      throw new Error('Prompt template not found');
    }

    return this.updateTemplate(id, { is_active: !template.is_active });
  }
};
