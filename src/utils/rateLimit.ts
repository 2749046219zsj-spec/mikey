import { supabase } from '../lib/supabase';

export async function checkRateLimit(endpoint: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rate-limiter`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    });

    if (response.status === 429) {
      const data = await response.json();
      return { allowed: false, retryAfter: data.retryAfter };
    }

    if (!response.ok) {
      throw new Error('Rate limit check failed');
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true };
  }
}
