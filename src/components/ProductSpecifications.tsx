import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProductSpecification {
  id: string;
  spec_name: string;
  spec_value: string;
  display_order: number;
}

interface ProductSpecificationsProps {
  productId: string;
}

export default function ProductSpecifications({ productId }: ProductSpecificationsProps) {
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecifications();
  }, [productId]);

  const loadSpecifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_specifications')
        .select('id, spec_name, spec_value, display_order')
        .eq('product_id', productId)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading specifications:', error);
        return;
      }

      setSpecifications(data || []);
    } catch (error) {
      console.error('Failed to load specifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (specifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="divide-y divide-gray-200">
        {specifications.map((spec) => (
          <div key={spec.id} className="flex py-3 px-4 hover:bg-gray-50 transition-colors">
            <div className="w-32 flex-shrink-0 font-medium text-gray-700 text-sm">
              {spec.spec_name}
            </div>
            <div className="flex-1 text-gray-900 text-sm">
              {spec.spec_value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
