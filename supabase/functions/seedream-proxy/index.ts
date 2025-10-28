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
      console.error('SEEDREAM_API_KEY is not configured');
      throw new Error('SEEDREAM_API_KEY environment variable is not set');
    }

    console.log('Seedream API Key exists:', apiKey.substring(0, 8) + '...');

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

    console.log('Received request:', {
      prompt: requestData.prompt.substring(0, 50) + '...',
      promptLength: requestData.prompt.length,
      hasImages: !!requestData.image,
      imageCount: requestData.image?.length || 0,
      size: requestData.size
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
      console.log('Including reference images:', requestData.image.length);
    }

    if (requestData.sequential_image_generation) {
      seedreamPayload.sequential_image_generation = requestData.sequential_image_generation;
      seedreamPayload.sequential_image_generation_options = requestData.sequential_image_generation_options || { max_images: 3 };
    }

    console.log('Calling Seedream API with payload:', JSON.stringify(seedreamPayload).substring(0, 200));

    const seedreamResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(seedreamPayload),
    });

    console.log('Seedream API response status:', seedreamResponse.status);

    if (!seedreamResponse.ok) {
      const errorText = await seedreamResponse.text();
      console.error('Seedream API error response:', {
        status: seedreamResponse.status,
        statusText: seedreamResponse.statusText,
        body: errorText.substring(0, 500)
      });

      let errorMessage = `API error: ${seedreamResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
        console.error('Parsed error:', errorData);
      } catch {
        errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
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

    console.log('Starting to stream response');

    const reader = seedreamResponse.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let chunkCount = 0;
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream finished, total chunks:', chunkCount);
              break;
            }

            chunkCount++;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.trim() && line.startsWith('data:')) {
                console.log('Streaming line:', line.substring(0, 100));
                controller.enqueue(new TextEncoder().encode(line + '\n'));
              }
            }
          }

          if (buffer.trim() && buffer.startsWith('data:')) {
            console.log('Final buffer:', buffer.substring(0, 100));
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