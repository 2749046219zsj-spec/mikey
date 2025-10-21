import { useState, useEffect } from 'react';
import { promptTemplateService, PromptTemplate } from '../services/promptTemplateService';

export const usePromptTemplates = (productCategoryId?: string) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productCategoryId) {
      loadTemplates();
    } else {
      setTemplates([]);
      setLoading(false);
    }
  }, [productCategoryId]);

  const loadTemplates = async () => {
    if (!productCategoryId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await promptTemplateService.getTemplatesByCategory(productCategoryId);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      console.error('Failed to load prompt templates:', err);
    } finally {
      setLoading(false);
    }
  };

  return { templates, loading, error, reload: loadTemplates };
};
