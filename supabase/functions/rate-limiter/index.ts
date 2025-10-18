import { createClient } from 'npm:@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowMs: 60000 },
  '/api/auth/login': { maxRequests: 5, windowMs: 60000 },
  '/api/auth/register': { maxRequests: 3, windowMs: 60000 },
  '/api/auth/reset-password': { maxRequests: 3, windowMs: 300000 },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { endpoint } = await req.json();
    const rateLimitConfig = RATE_LIMITS[endpoint] || RATE_LIMITS.default;

    const windowStart = new Date(Date.now() - rateLimitConfig.windowMs);

    const { data: existingLimit, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingLimit) {
      if (existingLimit.request_count >= rateLimitConfig.maxRequests) {
        const timeRemaining = Math.ceil(
          (new Date(existingLimit.window_start).getTime() +
            rateLimitConfig.windowMs -
            Date.now()) /
            1000
        );

        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: timeRemaining,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': timeRemaining.toString(),
            },
          }
        );
      }

      await supabase
        .from('rate_limits')
        .update({ request_count: existingLimit.request_count + 1 })
        .eq('id', existingLimit.id);

      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: rateLimitConfig.maxRequests - existingLimit.request_count - 1,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase.from('rate_limits').insert({
      user_id: user.id,
      endpoint,
      request_count: 1,
      window_start: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: rateLimitConfig.maxRequests - 1,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});