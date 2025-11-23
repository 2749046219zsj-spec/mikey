import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GeminiProxyRequest {
  model: string;
  messages: any[];
  extra_body?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
    });
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured. Please set GEMINI_API_KEY in Supabase secrets.',
          details: 'Contact administrator to configure the API key'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { model, messages, extra_body }: GeminiProxyRequest = await req.json();

    if (!model || !messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: model and messages' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Proxying request to Poe API:', {
      model,
      messageCount: messages.length,
      hasExtraBody: !!extra_body,
    });

    const requestBody: any = {
      model,
      messages,
    };

    if (extra_body) {
      requestBody.extra_body = extra_body;
    }

    const poeResponse = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!poeResponse.ok) {
      const errorText = await poeResponse.text();
      console.error('Poe API error:', {
        status: poeResponse.status,
        statusText: poeResponse.statusText,
        error: errorText,
      });

      let errorMessage = `API error: ${poeResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${errorText}`;
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: poeResponse.status
        }),
        {
          status: poeResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const responseData = await poeResponse.json();

    console.log('Successful proxy response:', {
      hasChoices: !!responseData.choices,
      choicesCount: responseData.choices?.length || 0,
    });

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});