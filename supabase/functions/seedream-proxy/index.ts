import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SeedreamRequest {
  prompt: string;
  image?: string[];
  size?: string;
  sequential_image_generation?: string;
  sequential_image_generation_options?: {
    max_images: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('SEEDREAM_API_KEY');
    if (!apiKey) {
      throw new Error('SEEDREAM_API_KEY environment variable is not set');
    }

    const requestData: SeedreamRequest = await req.json();

    if (!requestData.prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Proxying request to Seedream API:', {
      promptLength: requestData.prompt.length,
      hasImages: !!requestData.image,
      imageCount: requestData.image?.length || 0,
    });

    const seedreamPayload: any = {
      model: 'doubao-seedream-4-0-250828',
      prompt: requestData.prompt,
      response_format: 'url',
      size: requestData.size || '2K',
      stream: true,
      watermark: true,
    };

    if (requestData.image && requestData.image.length > 0) {
      seedreamPayload.image = requestData.image;
    }

    if (requestData.sequential_image_generation) {
      seedreamPayload.sequential_image_generation = requestData.sequential_image_generation;
      seedreamPayload.sequential_image_generation_options = requestData.sequential_image_generation_options || { max_images: 3 };
    }

    const seedreamResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(seedreamPayload),
    });

    if (!seedreamResponse.ok) {
      const errorText = await seedreamResponse.text();
      console.error('Seedream API error:', {
        status: seedreamResponse.status,
        error: errorText,
      });

      let errorMessage = `API error: ${seedreamResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${errorText}`;
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: seedreamResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const reader = seedreamResponse.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() && line.startsWith('data:')) {
                controller.enqueue(new TextEncoder().encode(line + '\n'));
              }
            }
          }

          if (buffer.trim() && buffer.startsWith('data:')) {
            controller.enqueue(new TextEncoder().encode(buffer + '\n'));
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
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