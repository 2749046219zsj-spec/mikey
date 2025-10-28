const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_URL = `${SUPABASE_URL}/functions/v1/seedream-proxy`;

interface SeedreamGenerationParams {
  prompt: string;
  imageUrls?: string[];
  size?: '1K' | '2K' | '4K';
  maxImages?: number;
}

interface SeedreamStreamData {
  status?: string;
  data?: {
    url?: string;
    b64_json?: string;
  }[];
  error?: string;
}

export class SeedreamApiService {
  async generateImage(params: SeedreamGenerationParams): Promise<string[]> {
    try {
      const requestBody: any = {
        prompt: params.prompt,
        size: params.size || '2K',
      };

      if (params.imageUrls && params.imageUrls.length > 0) {
        requestBody.image = params.imageUrls;
      }

      if (params.maxImages && params.maxImages > 1) {
        requestBody.sequential_image_generation = 'auto';
        requestBody.sequential_image_generation_options = {
          max_images: params.maxImages
        };
      }

      console.log('Sending Seedream request:', {
        promptLength: params.prompt.length,
        hasImages: !!params.imageUrls,
        imageCount: params.imageUrls?.length || 0,
        size: params.size,
        maxImages: params.maxImages
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `${errorMessage} - ${errorText}`;
        }

        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body stream available');
      }

      const decoder = new TextDecoder();
      const imageUrls: string[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            const jsonStr = line.replace('data:', '').trim();

            if (jsonStr === '[DONE]') {
              console.log('Stream completed');
              continue;
            }

            try {
              const data: SeedreamStreamData = JSON.parse(jsonStr);

              if (data.error) {
                console.error('Seedream API error:', data.error);
                throw new Error(data.error);
              }

              if (data.data && Array.isArray(data.data)) {
                for (const item of data.data) {
                  if (item.url) {
                    imageUrls.push(item.url);
                    console.log('Received image URL:', item.url);
                  }
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse stream data:', jsonStr);
            }
          }
        }
      }

      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.replace('data:', '').trim();
        if (jsonStr !== '[DONE]') {
          try {
            const data: SeedreamStreamData = JSON.parse(jsonStr);
            if (data.data && Array.isArray(data.data)) {
              for (const item of data.data) {
                if (item.url) {
                  imageUrls.push(item.url);
                }
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse final buffer:', jsonStr);
          }
        }
      }

      if (imageUrls.length === 0) {
        throw new Error('No images were generated');
      }

      console.log('Successfully generated images:', imageUrls.length);
      return imageUrls;

    } catch (error) {
      console.error('Seedream API Error:', error);
      throw error;
    }
  }

  async sendMessage(
    text: string,
    images: File[] = [],
    conversationHistory: any[] = []
  ): Promise<string> {
    const imageUrls: string[] = [];

    for (const file of images) {
      const base64 = await this.fileToBase64(file);
      imageUrls.push(base64);
    }

    const generatedImages = await this.generateImage({
      prompt: text,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      size: '2K',
      maxImages: 1
    });

    if (generatedImages.length === 0) {
      throw new Error('No image was generated');
    }

    return `![Generated Image](${generatedImages[0]})`;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
